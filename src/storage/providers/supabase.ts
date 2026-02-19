import type { SupabaseStorageConfig, UploadResult } from '../types';
import type { ResolvedInput } from '../types';
import { generateKey } from '../utils';

export async function supabaseUpload(
  config: SupabaseStorageConfig,
  resolved: ResolvedInput,
  keyPrefix?: string
): Promise<UploadResult> {
  const prefix = keyPrefix ?? config.keyPrefix;
  const key = generateKey(resolved.filename, prefix);

  const uploadUrl = `${config.url}/storage/v1/object/${config.bucket}/${key}`;

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

  const url = `${config.url}/storage/v1/object/public/${config.bucket}/${key}`;

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
  const deleteUrl = `${config.url}/storage/v1/object/${config.bucket}`;

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
