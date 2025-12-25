import type { Request, Response, NextFunction } from 'express';

/**
 * Parsed file object from multipart/form-data
 */
export interface ParsedFile {
  /** Field name in the form */
  fieldname: string;
  /** Original filename from client */
  originalname: string;
  /** File encoding */
  encoding: string;
  /** MIME type */
  mimetype: string;
  /** File size in bytes */
  size: number;
  /** Buffer containing file data */
  buffer: Buffer;
}

/**
 * Normalized payload after parsing multipart/form-data
 *
 * Fields are auto-parsed to appropriate types (JSON, numbers, booleans)
 */
export type ParsedPayload = {
  [key: string]: string | number | boolean | object | ParsedFile | ParsedFile[];
};

/**
 * Extend Express Request with payload property
 *
 * Opt-in via import - non-invasive augmentation
 */
declare global {
  namespace Express {
    interface Request {
      payload?: ParsedPayload;
    }
  }
}

/**
 * Configuration options for multipart parser
 */
export interface ParserOptions {
  /**
   * Maximum file size in bytes
   *
   * @default 10485760 (10MB)
   */
  maxFileSize?: number;

  /**
   * Maximum number of files allowed
   *
   * @default 10
   */
  maxFiles?: number;

  /**
   * Automatically parse JSON strings in text fields
   *
   * @default true
   *
   * @example
   * ```typescript
   * // Field value: '{"key":"value"}'
   * // autoParseJSON: true → { key: "value" }
   * // autoParseJSON: false → '{"key":"value"}'
   * ```
   */
  autoParseJSON?: boolean;

  /**
   * Automatically convert numeric strings to numbers
   *
   * @default true
   *
   * @example
   * ```typescript
   * // Field value: '123'
   * // autoParseNumbers: true → 123
   * // autoParseNumbers: false → '123'
   * ```
   */
  autoParseNumbers?: boolean;

  /**
   * Automatically convert boolean strings to booleans
   *
   * @default true
   *
   * @example
   * ```typescript
   * // Field value: 'true' or '1'
   * // autoParseBooleans: true → true
   * // autoParseBooleans: false → 'true'
   * ```
   */
  autoParseBooleans?: boolean;
}

/**
 * Express middleware function type
 */
export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
