import { randomUUID } from 'crypto';
import type { ParsedFile } from '../server/types';
import type { ResolvedInput, UploadInput, UploadOptions } from './types';

/**
 * Sanitize a filename to be safe for use in storage keys.
 * Replaces spaces with hyphens and removes non-alphanumeric characters (except dots and hyphens).
 */
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '');
}

/**
 * Generate a unique storage key.
 * Format: {prefix}/{uuid}-{sanitized-filename}
 */
export function generateKey(filename: string, prefix?: string): string {
  const uuid = randomUUID();
  const sanitized = sanitizeFilename(filename);
  const name = `${uuid}-${sanitized}`;
  if (prefix) {
    const trimmed = prefix.replace(/\/+$/, '');
    return `${trimmed}/${name}`;
  }
  return name;
}

/**
 * Convert a base64 data URI to a Buffer with MIME type.
 * Expects format: data:{mimetype};base64,{data}
 */
export function base64ToBuffer(dataUri: string): { buffer: Buffer; mimetype: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid base64 data URI format. Expected: data:{mimetype};base64,{data}');
  }
  const [, mimetype, data] = match;
  const buffer = Buffer.from(data, 'base64');
  return { buffer, mimetype };
}

function isParsedFile(input: UploadInput): input is ParsedFile {
  return (
    typeof input === 'object' &&
    !Buffer.isBuffer(input) &&
    'buffer' in input &&
    'originalname' in input &&
    'mimetype' in input
  );
}

/**
 * Normalize any UploadInput into a ResolvedInput with buffer, filename, mimetype, and size.
 */
export function resolveInput(input: UploadInput, options?: UploadOptions): ResolvedInput {
  if (isParsedFile(input)) {
    return {
      buffer: input.buffer,
      filename: options?.filename ?? input.originalname,
      mimetype: options?.mimetype ?? input.mimetype,
      size: input.size,
    };
  }

  if (Buffer.isBuffer(input)) {
    if (!options?.filename) {
      throw new Error('filename is required in options when uploading a Buffer');
    }
    const buffer = input;
    return {
      buffer,
      filename: options.filename,
      mimetype: options?.mimetype ?? 'application/octet-stream',
      size: buffer.length,
    };
  }

  if (typeof input === 'string') {
    const { buffer, mimetype } = base64ToBuffer(input);
    if (!options?.filename) {
      throw new Error('filename is required in options when uploading a base64 string');
    }
    return {
      buffer,
      filename: options.filename,
      mimetype: options?.mimetype ?? mimetype,
      size: buffer.length,
    };
  }

  throw new Error('Invalid upload input: must be a ParsedFile, Buffer, or base64 data URI string');
}
