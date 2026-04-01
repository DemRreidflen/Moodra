#!/usr/bin/env python3
"""
Moodra Cyrillic PDF Renderer
Renders HTML to PDF using WeasyPrint with Pyphen hyphenation support.

Endpoints:
  GET  /health                  — liveness check
  POST /render-pdf              — core book HTML → PDF (Phase A)
  POST /inject-designer-pages   — core PDF + image metadata → merged PDF (Phase B)
"""

import base64
import io
import os
import sys
import time
import logging
import traceback
from flask import Flask, request, jsonify, Response
import weasyprint
import pyphen
from pypdf import PdfReader, PdfWriter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)

app = Flask(__name__)
# Allow up to 50 MB request bodies (core PDF + designer page metadata)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

# ── Constants ─────────────────────────────────────────────────────────────────

# Root workspace directory — one level up from this file (cyrillic-renderer/)
_WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# Absolute path to bundled fonts directory (next to this file)
_FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

CYRILLIC_SAFE_FONTS = {
    "georgia", "times new roman", "times", "palatino linotype", "palatino",
    "book antiqua", "arial", "helvetica", "inter", "source sans pro",
    "courier new", "courier", "noto serif", "noto sans",
    "liberation serif", "liberation sans", "ubuntu", "dejavu serif", "dejavu sans",
}

SUPPORTED_LANGUAGES = {"ru", "uk"}
PYPHEN_DICTS: dict = {}

# ── Font helpers ──────────────────────────────────────────────────────────────

def _font_path(name: str) -> str:
    return "file://" + os.path.join(_FONTS_DIR, name)


def _inject_font_faces(html: str) -> str:
    lib_r  = _font_path("LiberationSerif-Regular.ttf")
    lib_b  = _font_path("LiberationSerif-Bold.ttf")
    lib_i  = _font_path("LiberationSerif-Italic.ttf")
    lib_bi = _font_path("LiberationSerif-BoldItalic.ttf")

    serif_families = [
        "Georgia", "Times New Roman", "Times", "Palatino Linotype",
        "Palatino", "Book Antiqua", "Liberation Serif", "Noto Serif",
    ]

    faces = []
    for family in serif_families:
        faces.append(f"""
@font-face {{
  font-family: '{family}';
  src: url('{lib_r}') format('truetype');
  font-weight: normal; font-style: normal;
}}
@font-face {{
  font-family: '{family}';
  src: url('{lib_b}') format('truetype');
  font-weight: bold; font-style: normal;
}}
@font-face {{
  font-family: '{family}';
  src: url('{lib_i}') format('truetype');
  font-weight: normal; font-style: italic;
}}
@font-face {{
  font-family: '{family}';
  src: url('{lib_bi}') format('truetype');
  font-weight: bold; font-style: italic;
}}""")

    font_css = "<style>/* bundled font-faces */\n" + "\n".join(faces) + "\n</style>\n"

    if "<head>" in html:
        html = html.replace("<head>", "<head>\n" + font_css, 1)
    elif "<HEAD>" in html:
        html = html.replace("<HEAD>", "<HEAD>\n" + font_css, 1)
    return html


def _get_pyphen(lang: str):
    if lang not in PYPHEN_DICTS:
        try:
            PYPHEN_DICTS[lang] = pyphen.Pyphen(lang=lang)
            log.info("Loaded Pyphen dictionary for lang=%s", lang)
        except Exception as exc:
            log.warning("Pyphen dict unavailable for lang=%s: %s", lang, exc)
            PYPHEN_DICTS[lang] = None
    return PYPHEN_DICTS[lang]


def _check_font(font_family: str) -> bool:
    first = font_family.split(",")[0].strip().strip("'\"").lower()
    return first in CYRILLIC_SAFE_FONTS

# ── Designer-page helpers ─────────────────────────────────────────────────────

def _resolve_upload_path(image_url: str) -> str:
    """
    Convert a server-relative URL like /uploads/designer-pages/3/abc.jpg
    into an absolute filesystem path. Never trusts path traversal (../).
    """
    # Normalise: strip leading slash, then join under Moodra-Space/
    clean = image_url.lstrip("/")
    full  = os.path.normpath(os.path.join(_WORKSPACE_DIR, "Moodra-Space", clean))
    # Safety guard: must still be under the workspace
    if not full.startswith(_WORKSPACE_DIR):
        raise ValueError(f"Unsafe image path: {image_url!r}")
    return full


def _render_image_page_pdf(
    file_path: str,
    page_size_css: str,
    pw_mm: float,
    ph_mm: float,
    fit_mode: str = "cover",
    bg_color: str = "#ffffff",
) -> bytes:
    """
    Render a single full-bleed image as a one-page PDF using WeasyPrint.
    Uses a file:// URI so WeasyPrint reads the image directly from disk —
    no HTTP request to the Node server, no network dependency.
    """
    safe_path = file_path.replace("\\", "/")
    html = f"""<!DOCTYPE html>
<html><head><style>
@page {{size:{page_size_css};margin:0;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{overflow:hidden;background:{bg_color};}}
.dp{{width:{pw_mm}mm;height:{ph_mm}mm;overflow:hidden;display:block;background:{bg_color};}}
.dp img{{width:100%;height:100%;object-fit:{fit_mode};display:block;}}
</style></head>
<body><div class="dp"><img src="file://{safe_path}" alt=""/></div></body>
</html>"""
    doc = weasyprint.HTML(string=html).render()
    return doc.write_pdf()


def _extract_chapter_anchors(pdf_bytes: bytes) -> dict:
    """
    Read named destinations from a WeasyPrint-generated PDF and return a map
    of { "chapter-0": pageIndex, "chapter-1": pageIndex, ... } (0-based).
    WeasyPrint creates named destinations for all id= attributes in the HTML.
    """
    anchors: dict = {}
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for name, dest in reader.named_destinations.items():
            clean = name.lstrip("#")
            if clean.startswith("chapter-"):
                try:
                    anchors[clean] = reader.get_destination_page_number(dest)
                except Exception:
                    pass
    except Exception as exc:
        log.warning("Anchor extraction failed: %s", exc)
    return anchors


def _build_merged_pdf(
    core_bytes: bytes,
    injections: list,
    anchors: dict,
    num_chapters: int,
) -> bytes:
    """
    Merge a list of injection PDFs into the core PDF at the correct positions.

    injections: list of { afterChapterIdx: int, pdf_bytes: bytes }
      afterChapterIdx == -1  →  before all chapters (after front matter)
      afterChapterIdx == N   →  after chapter N

    Algorithm:
      1. Compute the 0-based page index to insert AFTER for each injection.
      2. Build an insert_after map: { page_index: [pdf pages] }.
      3. Stream core pages into the output, appending designer pages where marked.
    """
    core_reader = PdfReader(io.BytesIO(core_bytes))
    total_pages = len(core_reader.pages)

    # Build insert_after map
    insert_after: dict = {}
    for inj in injections:
        idx = inj["afterChapterIdx"]
        if idx == -1:
            # Before all chapters = after last front-matter page
            chapter_0_start = anchors.get("chapter-0", total_pages)
            insert_pos = max(0, chapter_0_start - 1)
        elif idx + 1 < num_chapters:
            # Between chapter idx and chapter idx+1
            next_start = anchors.get(f"chapter-{idx + 1}", total_pages)
            insert_pos = max(0, next_start - 1)
        else:
            # After last chapter = end of document
            insert_pos = total_pages - 1

        if insert_pos not in insert_after:
            insert_after[insert_pos] = []

        inj_reader = PdfReader(io.BytesIO(inj["pdf_bytes"]))
        for page in inj_reader.pages:
            insert_after[insert_pos].append(page)

    # Stream to output
    writer = PdfWriter()
    for i, page in enumerate(core_reader.pages):
        writer.add_page(page)
        if i in insert_after:
            for dp_page in insert_after[i]:
                writer.add_page(dp_page)

    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "cyrillic-renderer"})


@app.route("/render-pdf", methods=["POST"])
def render_pdf():
    """Phase A: render book HTML (no designer pages) → PDF bytes."""
    t0 = time.time()
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        html     = data.get("html", "")
        language = data.get("language", "ru").lower()
        fonts    = data.get("fonts", [])
        meta     = data.get("meta", {})

        if not html:
            return jsonify({"error": "html is required"}), 400
        if language not in SUPPORTED_LANGUAGES:
            return jsonify({"error": f"Unsupported language '{language}'"}), 400

        for font_entry in fonts:
            family = font_entry.get("family", "")
            if family and not _check_font(family):
                return jsonify({
                    "error": (
                        f"Font '{family}' does not have confirmed Cyrillic glyph coverage. "
                        "Use a Cyrillic-safe font such as Georgia, Noto Serif, or Arial."
                    )
                }), 422

        _get_pyphen(language)
        html = _inject_font_faces(html)

        try:
            doc       = weasyprint.HTML(string=html, base_url="http://127.0.0.1:5000").render()
            pdf_bytes = doc.write_pdf()
        except Exception as exc:
            log.error("WeasyPrint render failed: %s\n%s", exc, traceback.format_exc())
            return jsonify({"error": f"PDF render failed: {str(exc)}"}), 500

        elapsed    = round((time.time() - t0) * 1000)
        page_count = len(doc.pages)
        book_id    = meta.get("bookId", "?")

        log.info(
            "Rendered PDF | bookId=%s lang=%s pages=%d time=%dms",
            book_id, language, page_count, elapsed,
        )

        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={
                "X-Render-Time-Ms": str(elapsed),
                "X-Page-Count":     str(page_count),
                "X-Engine":         "weasyprint-cyrillic",
            },
        )

    except Exception as exc:
        log.error("Unhandled error in /render-pdf: %s\n%s", exc, traceback.format_exc())
        return jsonify({"error": f"Internal server error: {str(exc)}"}), 500


@app.route("/inject-designer-pages", methods=["POST"])
def inject_designer_pages():
    """
    Phase B: inject full-bleed designer page images into a core PDF.

    Expected JSON body:
      corePdf        : base64-encoded core PDF bytes
      numChapters    : total chapter count (for insertion boundary logic)
      pageSize       : CSS page size string, e.g. "A5" or "176mm 250mm"
      pageWidthMm    : float
      pageHeightMm   : float
      designerPages  : list of {
          id, imageUrl, afterChapterIdx, fitMode, backgroundColor
        }
      meta           : { bookId }

    Returns the merged PDF as application/pdf.
    """
    t0 = time.time()
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        core_b64      = data.get("corePdf", "")
        num_chapters  = int(data.get("numChapters", 0))
        page_size_css = data.get("pageSize", "A5")
        pw_mm         = float(data.get("pageWidthMm",  148))
        ph_mm         = float(data.get("pageHeightMm", 210))
        dp_entries    = data.get("designerPages", [])
        meta          = data.get("meta", {})
        book_id       = meta.get("bookId", "?")

        if not core_b64:
            return jsonify({"error": "corePdf is required"}), 400
        if not dp_entries:
            return jsonify({"error": "designerPages list is empty"}), 400

        # Decode core PDF
        try:
            core_bytes = base64.b64decode(core_b64)
        except Exception as exc:
            return jsonify({"error": f"Failed to decode corePdf: {exc}"}), 400

        # Extract chapter anchors from the core PDF (WeasyPrint named destinations)
        anchors = _extract_chapter_anchors(core_bytes)
        log.info(
            "Inject | bookId=%s chapters=%d anchors=%s pages=%d",
            book_id, num_chapters, anchors,
            len(PdfReader(io.BytesIO(core_bytes)).pages),
        )

        # Render each designer page image as an isolated single-page PDF
        injections = []
        for dp in dp_entries:
            image_url       = dp.get("imageUrl", "")
            after_ch_idx    = int(dp.get("afterChapterIdx", -1))
            fit_mode        = dp.get("fitMode", "cover")
            bg_color        = dp.get("backgroundColor", "#ffffff")

            if not image_url:
                log.warning("Skipping designer page with empty imageUrl (id=%s)", dp.get("id"))
                continue

            try:
                file_path = _resolve_upload_path(image_url)
            except ValueError as exc:
                log.warning("Skipping unsafe designer page path: %s", exc)
                continue

            if not os.path.isfile(file_path):
                log.warning(
                    "Designer page image not found on disk: %s (id=%s)",
                    file_path, dp.get("id"),
                )
                continue

            try:
                t_img = time.time()
                img_pdf_bytes = _render_image_page_pdf(
                    file_path, page_size_css, pw_mm, ph_mm, fit_mode, bg_color,
                )
                log.info(
                    "  Image page rendered | id=%s path=%s time=%dms",
                    dp.get("id"), os.path.basename(file_path),
                    round((time.time() - t_img) * 1000),
                )
                injections.append({
                    "afterChapterIdx": after_ch_idx,
                    "pdf_bytes": img_pdf_bytes,
                })
            except Exception as exc:
                log.error(
                    "Failed to render designer page (id=%s): %s\n%s",
                    dp.get("id"), exc, traceback.format_exc(),
                )
                # Skip this page and continue with the rest — partial export
                # is better than a total failure.

        if not injections:
            log.warning(
                "All designer pages failed or were skipped for bookId=%s; "
                "returning core PDF unchanged.",
                book_id,
            )
            return Response(
                core_bytes,
                mimetype="application/pdf",
                headers={"X-Engine": "weasyprint-cyrillic", "X-Injected": "0"},
            )

        # Merge injections into core PDF
        try:
            final_bytes = _build_merged_pdf(core_bytes, injections, anchors, num_chapters)
        except Exception as exc:
            log.error("PDF merge failed: %s\n%s", exc, traceback.format_exc())
            return jsonify({"error": f"PDF merge failed: {str(exc)}"}), 500

        elapsed = round((time.time() - t0) * 1000)
        final_pages = len(PdfReader(io.BytesIO(final_bytes)).pages)
        log.info(
            "Inject done | bookId=%s injected=%d finalPages=%d time=%dms",
            book_id, len(injections), final_pages, elapsed,
        )

        return Response(
            final_bytes,
            mimetype="application/pdf",
            headers={
                "X-Engine":         "weasyprint-cyrillic",
                "X-Injected":       str(len(injections)),
                "X-Page-Count":     str(final_pages),
                "X-Render-Time-Ms": str(elapsed),
            },
        )

    except Exception as exc:
        log.error("Unhandled error in /inject-designer-pages: %s\n%s", exc, traceback.format_exc())
        return jsonify({"error": f"Internal server error: {str(exc)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("CYRILLIC_RENDERER_PORT", 5001))
    log.info("Starting Cyrillic PDF Renderer on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=False)
