#!/usr/bin/env python3
"""
Moodra Cyrillic PDF Renderer
Renders HTML to PDF using WeasyPrint with Pyphen hyphenation support.
"""

import os
import sys
import time
import logging
import traceback
from flask import Flask, request, jsonify, Response
import weasyprint
import pyphen

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)

app = Flask(__name__)

# Whitelisted fonts confirmed to support Cyrillic glyphs.
# Font matching is done against the first CSS family name token.
CYRILLIC_SAFE_FONTS = {
    "georgia",
    "times new roman",
    "times",
    "palatino linotype",
    "palatino",
    "book antiqua",
    "arial",
    "helvetica",
    "inter",
    "source sans pro",
    "courier new",
    "courier",
    "noto serif",
    "noto sans",
    "liberation serif",
    "liberation sans",
    "ubuntu",
    "dejavu serif",
    "dejavu sans",
}

SUPPORTED_LANGUAGES = {"ru", "uk"}

PYPHEN_DICTS = {}

# Absolute path to bundled fonts directory (next to this file)
_FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

def _font_path(name: str) -> str:
    """Return file:// URI for a font file in the bundled fonts directory."""
    return "file://" + os.path.join(_FONTS_DIR, name)

def _inject_font_faces(html: str) -> str:
    """
    Inject @font-face rules into the HTML <head> so WeasyPrint can render
    fonts by name even when they are not installed system-wide.
    Liberation Serif is metric-compatible with Times New Roman / Georgia.
    DejaVu Serif (system-installed) is the final fallback.
    """
    lib_r  = _font_path("LiberationSerif-Regular.ttf")
    lib_b  = _font_path("LiberationSerif-Bold.ttf")
    lib_i  = _font_path("LiberationSerif-Italic.ttf")
    lib_bi = _font_path("LiberationSerif-BoldItalic.ttf")

    # Font families that map to Liberation Serif (serif, Cyrillic-capable)
    serif_families = [
        "Georgia",
        "Times New Roman",
        "Times",
        "Palatino Linotype",
        "Palatino",
        "Book Antiqua",
        "Liberation Serif",
        "Noto Serif",
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

    # Insert immediately before the first <style> or at start of <head>
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


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "cyrillic-renderer"})


@app.route("/render-pdf", methods=["POST"])
def render_pdf():
    t0 = time.time()
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        html = data.get("html", "")
        language = data.get("language", "ru").lower()
        page_cfg = data.get("page", {})
        fonts = data.get("fonts", [])
        meta = data.get("meta", {})

        if not html:
            return jsonify({"error": "html is required"}), 400

        if language not in SUPPORTED_LANGUAGES:
            return jsonify({"error": f"Unsupported language '{language}'. Must be one of: {SUPPORTED_LANGUAGES}"}), 400

        # Font whitelist check
        for font_entry in fonts:
            family = font_entry.get("family", "")
            if family and not _check_font(family):
                return jsonify({
                    "error": f"Font '{family}' does not have confirmed Cyrillic glyph coverage. "
                             f"Use a Cyrillic-safe font such as Georgia, Noto Serif, or Arial."
                }), 422

        # Pre-load Pyphen dict to confirm availability
        _get_pyphen(language)

        # Inject @font-face rules so WeasyPrint can find fonts by their
        # CSS family name even when they're not installed system-wide.
        html = _inject_font_faces(html)

        # Render via WeasyPrint
        try:
            doc = weasyprint.HTML(string=html).render()
            pdf_bytes = doc.write_pdf()
        except Exception as exc:
            log.error("WeasyPrint render failed: %s\n%s", exc, traceback.format_exc())
            return jsonify({"error": f"PDF render failed: {str(exc)}"}), 500

        elapsed = round((time.time() - t0) * 1000)
        page_count = len(doc.pages)
        book_id = meta.get("bookId", "?")

        log.info(
            "Rendered PDF | bookId=%s lang=%s pages=%d time=%dms",
            book_id, language, page_count, elapsed,
        )

        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={
                "X-Render-Time-Ms": str(elapsed),
                "X-Page-Count": str(page_count),
                "X-Engine": "weasyprint-cyrillic",
            },
        )

    except Exception as exc:
        log.error("Unhandled error: %s\n%s", exc, traceback.format_exc())
        return jsonify({"error": f"Internal server error: {str(exc)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("CYRILLIC_RENDERER_PORT", 5001))
    log.info("Starting Cyrillic PDF Renderer on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=False)
