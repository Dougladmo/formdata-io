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
 * Attempts to automatically parse a string value to appropriate type
 *
 * @param value - String value to parse
 * @param options - Parser options
 * @returns Parsed value (JSON object, number, boolean, or original string)
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

    const busboy = Busboy({
      headers: req.headers as any,
      limits: {
        fileSize: opts.maxFileSize,
        files: opts.maxFiles,
      },
    });

    // Handler for text fields
    busboy.on('field', (fieldname: string, value: string) => {
      const parsedValue = autoParse(value, opts);

      // If field already exists, convert to array
      if (payload[fieldname] !== undefined) {
        if (Array.isArray(payload[fieldname])) {
          (payload[fieldname] as any[]).push(parsedValue);
        } else {
          payload[fieldname] = [payload[fieldname], parsedValue];
        }
      } else {
        payload[fieldname] = parsedValue;
      }
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
          file.resume(); // CRITICAL: drain stream to prevent backpressure
          return reject(
            new Error(`Maximum number of files (${opts.maxFiles}) exceeded`)
          );
        }

        const chunks: Buffer[] = [];
        let size = 0;

        file.on('data', (chunk: Buffer) => {
          size += chunk.length;

          // Enforce size limit
          if (size > opts.maxFileSize) {
            file.resume(); // CRITICAL: drain stream
            return reject(
              new Error(
                `File size exceeds limit of ${opts.maxFileSize} bytes`
              )
            );
          }

          chunks.push(chunk);
        });

        file.on('end', () => {
          const parsedFile: ParsedFile = {
            fieldname,
            originalname: info.filename,
            encoding: info.encoding,
            mimetype: info.mimeType,
            size,
            buffer: Buffer.concat(chunks),
          };

          files.push(parsedFile);
        });

        file.on('error', reject);
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
        if (payload[file.fieldname] !== undefined) {
          // Field already exists, convert to array
          if (Array.isArray(payload[file.fieldname])) {
            (payload[file.fieldname] as ParsedFile[]).push(file);
          } else {
            payload[file.fieldname] = [payload[file.fieldname] as ParsedFile, file];
          }
        } else {
          payload[file.fieldname] = file;
        }
      });

      resolve(payload);
    });

    // Handler for parsing errors
    busboy.on('error', reject);

    // Pipe request stream to busboy
    req.pipe(busboy);
  });
}
