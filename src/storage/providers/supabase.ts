import type { ResolvedInput, SupabaseStorageConfig, UploadResult } from '../types';
import { generateKey } from '../utils';

export async function supabaseUpload(
  config: SupabaseStorageConfig,
  resolved: ResolvedInput,
  keyPrefix?: string
): Promise<UploadResult> {
  // Fix #2: strip trailing slash to prevent double-slash in constructed URLs
  const baseUrl = config.url.replace(/\/$/, '');

  const prefix = keyPrefix ?? config.keyPrefix;
  const key = generateKey(resolved.filename, prefix);

  const uploadUrl = `${baseUrl}/storage/v1/object/${config.bucket}/${key}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.serviceKey}`,
      'Content-Type': resolved.mimetype,
      'Content-Length': String(resolved.size),
    },
    body: resolved.buffer as unknown as BodyInit,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase Storage upload failed (${response.status}): ${text}`);
  }

  // Fix #3: only construct the public URL when the bucket is public (default: true).
  // Private buckets require a signed URL — return the key so callers can generate one
  // via `supabase.storage.from(bucket).createSignedUrl(key, expiresIn)`.
  const isPublic = config.publicBucket !== false;
  const url = isPublic
    ? `${baseUrl}/storage/v1/object/public/${config.bucket}/${key}`
    : key;

  return {
    url,
    key,
    size: resolved.size,
    mimetype: resolved.mimetype,
  };
}

export async function supabaseDelete(
  config: SupabaseStorageConfig,
  key: string
): Promise<void> {
  // Fix #2: strip trailing slash
  const baseUrl = config.url.replace(/\/$/, '');
  const deleteUrl = `${baseUrl}/storage/v1/object/${config.bucket}`;

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${config.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [key] }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase Storage delete failed (${response.status}): ${text}`);
  }
}
