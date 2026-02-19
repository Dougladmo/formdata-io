import { randomUUID } from 'crypto';
import vm from 'node:vm';
import type { ParsedFile } from '../server/types';
import type { ResolvedInput, UploadInput, UploadOptions } from './types';

const DATA_URI_MAX_LENGTH = 100 * 1024 * 1024; // 100 MB
const REGEX_TIMEOUT_MS = 50;

// Compiled once at module load; vm.createContext() is called per-invocation for isolation.
const VM_REGEX_SCRIPT = new vm.Script('input.match(pattern)');

export class RegExpTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`RegExp execution timed out after ${timeoutMs}ms`);
    this.name = 'RegExpTimeoutError';
  }
}

// Runs a regex with a real timeout via vm.runInNewContext, preventing ReDoS attacks.
function execRegex(
  input: string,
  pattern: RegExp,
  timeoutMs = REGEX_TIMEOUT_MS
): RegExpMatchArray | null {
  if (input.length > DATA_URI_MAX_LENGTH) {
    throw new Error(
      `Input length (${input.length}) exceeds maximum allowed (${DATA_URI_MAX_LENGTH} bytes)`
    );
  }
  try {
    const context = vm.createContext({ input, pattern });
    return VM_REGEX_SCRIPT.runInContext(context, { timeout: timeoutMs }) as RegExpMatchArray | null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout')) {
      throw new RegExpTimeoutError(timeoutMs);
    }
    throw err;
  }
}

// Uses NFD decomposition to transliterate accented chars (é → e) before stripping non-ASCII,
// so accented filenames produce readable keys instead of empty strings.
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
}

/** Format: {prefix}/{uuid}-{sanitized-filename} */
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

/** Parses a base64 data URI into a Buffer and MIME type. */
export function base64ToBuffer(dataUri: string): { buffer: Buffer; mimetype: string } {
  const match = execRegex(dataUri, /^data:([^;]+);base64,(.+)$/);
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

/** Normalizes any UploadInput into a ResolvedInput with buffer, filename, mimetype, and size. */
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
