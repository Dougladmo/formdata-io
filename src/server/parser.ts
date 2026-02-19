import Busboy from 'busboy';
import type { Request } from 'express';
import type { ParsedFile, ParsedPayload, ParserOptions } from './types';

const DEFAULT_OPTIONS: Required<ParserOptions> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  maxFields: 100,
  maxFieldSize: 64 * 1024, // 64KB
  maxTotalFileSize: Infinity,
  autoParseJSON: true,
  autoParseNumbers: true,
  autoParseBooleans: true,
};

type ParsedValue = string | number | boolean | object | ParsedFile;

function normalizeField(
  payload: ParsedPayload,
  fieldname: string,
  value: ParsedValue
): void {
  const existing = payload[fieldname];

  if (existing !== undefined) {
    if (Array.isArray(existing)) {
      (existing as ParsedValue[]).push(value);
    } else {
      payload[fieldname] = [existing as ParsedValue, value];
    }
  } else {
    payload[fieldname] = value;
  }
}

function autoParse(
  value: string,
  options: Required<ParserOptions>
): string | number | boolean | object {
  if (options.autoParseJSON) {
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        return JSON.parse(value);
      } catch {
        // not valid JSON, continue
      }
    }
  }

  if (options.autoParseNumbers) {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }
  }

  if (options.autoParseBooleans) {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return value;
}

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
    let totalFileSize = 0;

    const contentType = req.headers['content-type'];
    if (!contentType || typeof contentType !== 'string') {
      return reject(new Error('Missing or invalid content-type header'));
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: opts.maxFileSize,
        files: opts.maxFiles,
        fields: opts.maxFields,
        fieldSize: opts.maxFieldSize,
      },
    });

    busboy.on('field', (fieldname: string, value: string) => {
      const parsedValue = autoParse(value, opts);
      normalizeField(payload, fieldname, parsedValue);
    });

    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; encoding: string; mimeType: string }
      ) => {
        fileCount++;

        if (fileCount > opts.maxFiles) {
          hasError = true;
          file.resume();
          reject(
            new Error(`Maximum number of files (${opts.maxFiles}) exceeded`)
          );
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        let fileSizeExceeded = false;

        file.on('data', (chunk: Buffer) => {
          if (hasError || fileSizeExceeded) {
            return;
          }

          size += chunk.length;
          totalFileSize += chunk.length;

          if (size > opts.maxFileSize) {
            fileSizeExceeded = true;
            hasError = true;
            file.resume();
            reject(
              new Error(
                `File size exceeds limit of ${opts.maxFileSize} bytes`
              )
            );
            return;
          }

          if (opts.maxTotalFileSize !== Infinity && totalFileSize > opts.maxTotalFileSize) {
            fileSizeExceeded = true;
            hasError = true;
            file.resume();
            reject(
              new Error(
                `Total file size exceeds limit of ${opts.maxTotalFileSize} bytes`
              )
            );
            return;
          }

          chunks.push(chunk);
        });

        file.on('end', () => {
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

    busboy.on('limit', () => {
      if (hasError) return;
      hasError = true;
      reject(new Error('File size limit exceeded'));
    });

    busboy.on('finish', () => {
      if (hasError) return;

      files.forEach((file) => {
        normalizeField(payload, file.fieldname, file);
      });

      resolve(payload);
    });

    busboy.on('error', reject);

    req.pipe(busboy);
  });
}
