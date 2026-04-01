import type { ExportManifest, CoreExportResult } from "./types.js";

/**
 * Phase B — Designer page injection.
 *
 * Sends the core PDF buffer + designer page metadata to the Python renderer's
 * /inject-designer-pages endpoint. The Python side:
 *   1. Extracts chapter anchor positions from the core PDF using pypdf.
 *   2. Renders each designer page image as an isolated single-page PDF via
 *      WeasyPrint (file:// URI — no HTTP, no base_url dependency).
 *   3. Merges everything in the correct order using pypdf PdfWriter.
 *
 * Returns the final merged PDF buffer ready to stream to the client.
 * Throws on failure so the caller can return a structured error.
 */
export async function injectDesignerPages(
  coreResult: CoreExportResult,
  manifest: ExportManifest,
  rendererUrl: string,
): Promise<Buffer> {
  const { layout, designerPages, chapters, bookId } = manifest;
  const enabledPages = designerPages.filter(dp => dp.enabled);

  const t0 = Date.now();
  console.log(
    `[InjectDesignerPages] bookId=${bookId} count=${enabledPages.length}`,
    enabledPages.map(dp => ({
      id:   dp.id,
      url:  dp.imageUrl,
      after: dp.afterChapterIdx,
      bytes: dp.imageUrl.startsWith("data:") ? `${Math.round(dp.imageUrl.length * 0.75 / 1024)}KB(b64)` : "url",
    })),
  );

  const payload = {
    corePdf:      coreResult.pdfBuffer.toString("base64"),
    numChapters:  chapters.length,
    pageSize:     layout.pageSizeCSS,
    pageWidthMm:  layout.pageSizeWidthMm,
    pageHeightMm: layout.pageSizeHeightMm,
    meta: { bookId: String(bookId) },
    designerPages: enabledPages.map(dp => ({
      id:             dp.id,
      imageUrl:       dp.imageUrl,
      afterChapterIdx: dp.afterChapterIdx,
      fitMode:        dp.fitMode,
      backgroundColor: dp.backgroundColor,
    })),
  };

  const response = await fetch(`${rendererUrl}/inject-designer-pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
    signal:  AbortSignal.timeout(180_000), // 3 min — image renders can be slow
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: "Unknown injection error" }));
    throw new Error(`Designer page injection failed (${response.status}): ${errBody.error ?? "unknown"}`);
  }

  const arrayBuf = await response.arrayBuffer();
  const finalBuffer = Buffer.from(arrayBuf);

  console.log(
    `[InjectDesignerPages] done bookId=${bookId} pages=${enabledPages.length} ` +
    `finalSize=${Math.round(finalBuffer.length / 1024)}KB time=${Date.now() - t0}ms`,
  );

  return finalBuffer;
}
