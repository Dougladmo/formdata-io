import type { FormDataValue, FormDataPayload, PayloadOptions } from './types';

/**
 * Checks if a value is a File or Blob object
 *
 * Handles environments where File/Blob may not be defined (e.g., JSDOM, SSR)
 *
 * @param value - Value to check
 * @returns True if value is File or Blob
 */
export function isFileOrBlob(value: unknown): value is File | Blob {
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  return false;
}

/**
 * Checks if a value is a plain object (not File, Blob, Date, Array, or null)
 *
 * Order matters: File/Blob checked before Date since File extends Blob
 *
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  if (isFileOrBlob(value)) return false;
  if (value instanceof Date) return false;
  if (Array.isArray(value)) return false;
  return true;
}

/**
 * Converts a primitive value to string according to options
 *
 * @param value - Value to convert
 * @param options - Conversion options
 * @returns String representation or undefined to skip
 */
export function valueToString(
  value: FormDataValue,
  options: PayloadOptions
): string | undefined {
  // null: '' or skip (based on nullsAsUndefineds)
  if (value === null) {
    return options.nullsAsUndefineds ? undefined : '';
  }

  // undefined: always skip
  if (value === undefined) {
    return undefined;
  }

  // boolean: '1'/'0' or 'true'/'false' (based on booleansAsIntegers)
  if (typeof value === 'boolean') {
    if (options.booleansAsIntegers) {
      return value ? '1' : '0';
    }
    return value.toString();
  }

  // Date: ISO 8601 string
  if (value instanceof Date) {
    return value.toISOString();
  }

  // number: string representation (handles NaN, Infinity correctly)
  if (typeof value === 'number') {
    return value.toString();
  }

  // string: return as-is
  if (typeof value === 'string') {
    return value;
  }

  // Shouldn't reach here but return undefined for safety
  return undefined;
}

/**
 * Builds field name with support for array/object notation
 *
 * @param parentKey - Parent field name
 * @param key - Current key (string or number for arrays)
 * @param options - Configuration options
 * @returns Formatted field name
 *
 * @example
 * ```typescript
 * buildFieldName('', 'name', opts) // 'name'
 * buildFieldName('user', 'email', opts) // 'user[email]'
 * buildFieldName('tags', 0, { indices: false }) // 'tags'
 * buildFieldName('tags', 0, { indices: true }) // 'tags[0]'
 * ```
 */
export function buildFieldName(
  parentKey: string,
  key: string | number,
  options: PayloadOptions
): string {
  // Array index handling
  if (typeof key === 'number') {
    return options.indices ? `${parentKey}[${key}]` : parentKey;
  }

  // Object key handling
  return parentKey ? `${parentKey}[${key}]` : key;
}
