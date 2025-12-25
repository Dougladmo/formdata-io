import type { Request, Response, NextFunction } from 'express';
import { parseMultipart } from './parser';
import type { ParserOptions, MiddlewareFunction } from './types';

/**
 * Creates Express middleware for parsing multipart/form-data
 *
 * @param options - Configuration options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { parser } from 'formdata-io/server';
 *
 * const app = express();
 *
 * // Use with default options (10MB, 10 files)
 * app.post('/upload', parser(), (req, res) => {
 *   const { name, avatar } = req.payload;
 *   res.json({ ok: true });
 * });
 *
 * // Use with custom options
 * app.post('/photos', parser({ maxFileSize: 5 * 1024 * 1024 }), (req, res) => {
 *   const photos = req.payload?.photos;
 *   res.json({ count: Array.isArray(photos) ? photos.length : 1 });
 * });
 * ```
 */
export function parser(options: ParserOptions = {}): MiddlewareFunction {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only process multipart/form-data requests
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return next();
    }

    try {
      req.payload = await parseMultipart(req, options);
      next();
    } catch (error) {
      // Pass error to Express error handler
      next(error);
    }
  };
}
