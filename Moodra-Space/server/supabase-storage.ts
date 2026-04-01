/**
 * Server-side Supabase Storage helper.
 * Uses the service role key — never expose this to the client.
 * All operations go through the Supabase Storage REST API directly
 * (no extra npm dependency required).
 */

function storageBase(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL environment variable is not set");
  return `${url.replace(/\/$/, "")}/storage/v1`;
}

function bucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "uploads";
}

function authHeader(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  return `Bearer ${key}`;
}

/**
 * Upload a buffer to Supabase Storage.
 * @param storagePath  Path inside the bucket, e.g. "designer-pages/42/img.jpg"
 * @param buffer       File contents
 * @param mimeType     MIME type, e.g. "image/jpeg"
 */
export async function uploadFile(
  storagePath: string,
  buffer: Buffer,
  mimeType: string,
): Promise<void> {
  const url = `${storageBase()}/object/${bucket()}/${storagePath}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed (${res.status}): ${body}`);
  }
}

/**
 * Download a file from Supabase Storage.
 * Returns the raw buffer and the response Content-Type.
 * @param storagePath  Path inside the bucket, e.g. "designer-pages/42/img.jpg"
 */
export async function downloadFile(
  storagePath: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const url = `${storageBase()}/object/${bucket()}/${storagePath}`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase Storage download failed (${res.status}): ${body}`);
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

/**
 * Stream a file from Supabase Storage directly to an Express response.
 * Does NOT buffer the file in memory — pipes directly.
 * @param storagePath  Path inside the bucket, e.g. "designer-pages/42/img.jpg"
 * @returns { response, contentType } where response is the fetch Response object
 */
export async function getFileStream(
  storagePath: string,
): Promise<{ response: Response; contentType: string }> {
  const url = `${storageBase()}/object/${bucket()}/${storagePath}`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase Storage download failed (${res.status}): ${body}`);
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return { response: res, contentType };
}
