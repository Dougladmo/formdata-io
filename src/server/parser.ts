import Busboy from 'busboy';
import type { Request } from 'express';
import type { ParsedFile, ParsedPayload, ParserOptions } from './types';

const DEFAULT_OPTIONS: Required<ParserOptions> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  autoParseJSON: true,
  autoParseNumbers: true,
  autoParseBooleans: true,
};

/**
 * Type representing a single parsed value (not an array)
 */
type ParsedValue = string | number | boolean | object | ParsedFile;

/**
 * Normalizes a field into the payload, converting to array if needed
 *
 * @param payload - Current payload object
 * @param fieldname - Field name
 * @param value - Value to add (string, number, boolean, object, or ParsedFile)
 */
function normalizeField(
  payload: ParsedPayload,
  fieldname: string,
  value: ParsedValue
): void {
  const existing = payload[fieldname];

  if (existing !== undefined) {
    // Field already exists, convert to array
    if (Array.isArray(existing)) {
      (existing as ParsedValue[]).push(value);
    } else {
      payload[fieldname] = [existing as ParsedValue, value];
    }
  } else {
    payload[fieldname] = value;
  }
}

/**
 * Attempts to automatically parse a string value to appropriate type
 *
 * Parsing order: JSON → Boolean → Number → String (fallback)
 *
 * @param value - String value to parse
 * @param options - Parser options controlling auto-conversion behavior
 * @returns Parsed value (JSON object, number, boolean, or original string)
 *
 * @example
 * ```typescript
 * autoParse('{"key":"value"}', opts) // → { key: "value" }
 * autoParse('true', opts) // → true
 * autoParse('123', opts) // → 123
 * autoParse('hello', opts) // → "hello"
 * ```
 */
function autoParse(
  value: string,
  options: Required<ParserOptions>
): string | number | boolean | object {
  // 1. Try JSON parsing (if starts/ends with {} or [])
  if (options.autoParseJSON) {
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        return JSON.parse(value);
      } catch {
        // Fallback to string if not valid JSON
      }
    }
  }

  // 2. Try boolean conversion
  if (options.autoParseBooleans) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '1') return true;
    if (value === '0') return false;
  }

  // 3. Try number conversion
  if (options.autoParseNumbers) {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }
  }

  // 4. Return as string
  return value;
}

/**
 * Parses multipart/form-data request using busboy
 *
 * @param req - Express request object
 * @param options - Parser configuration options
 * @returns Promise resolving to normalized payload
 *
 * @example
 * ```typescript
 * const payload = await parseMultipart(req, {
 *   maxFileSize: 5 * 1024 * 1024, // 5MB
 *   maxFiles: 5
 * });
 *
 * console.log(payload.name); // Auto-parsed text field
 * console.log(payload.avatar); // ParsedFile object
 * ```
 */
export function parseMultipart(
  req: Request,
  options: Partial<ParserOptions> = {}
): Promise<ParsedPayload> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const payload: ParsedPayload = {};
    const files: ParsedFile[] = [];
    let fileCount = 0;
    let hasError = false;

    // Validate content-type header
    const contentType = req.headers['content-type'];
    if (!contentType || typeof contentType !== 'string') {
      return reject(new Error('Missing or invalid content-type header'));
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: opts.maxFileSize,
        files: opts.maxFiles,
      },
    });

    // Handler for text fields
    busboy.on('field', (fieldname: string, value: string) => {
      const parsedValue = autoParse(value, opts);
      normalizeField(payload, fieldname, parsedValue);
    });

    // Handler for file uploads
    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; encoding: string; mimeType: string }
      ) => {
        fileCount++;

        // Enforce file count limit
        if (fileCount > opts.maxFiles) {
          hasError = true;
          file.resume(); // Drain stream to prevent backpressure
          reject(
            new Error(`Maximum number of files (${opts.maxFiles}) exceeded`)
          );
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        let fileSizeExceeded = false;

        file.on('data', (chunk: Buffer) => {
          // Skip processing if error already occurred
          if (hasError || fileSizeExceeded) {
            return;
          }

          size += chunk.length;

          // Enforce size limit
          if (size > opts.maxFileSize) {
            fileSizeExceeded = true;
            hasError = true;
            file.resume(); // Drain remaining stream data
            reject(
              new Error(
                `File size exceeds limit of ${opts.maxFileSize} bytes`
              )
            );
            return;
          }

          chunks.push(chunk);
        });

        file.on('end', () => {
          // Only add file if no errors occurred
          if (!hasError && !fileSizeExceeded) {
            const parsedFile: ParsedFile = {
              fieldname,
              originalname: info.filename,
              encoding: info.encoding,
              mimetype: info.mimeType,
              size,
              buffer: Buffer.concat(chunks),
            };

            files.push(parsedFile);
          }
        });

        file.on('error', (err) => {
          hasError = true;
          reject(err);
        });
      }
    );

    // Handler for limit exceeded
    busboy.on('limit', () => {
      reject(new Error('File size limit exceeded'));
    });

    // Handler for parsing completion
    busboy.on('finish', () => {
      // Normalize files into payload
      files.forEach((file) => {
        normalizeField(payload, file.fieldname, file);
      });

      resolve(payload);
    });

    // Handler for parsing errors
    busboy.on('error', reject);

    // Pipe request stream to busboy
    req.pipe(busboy);
  });
}
