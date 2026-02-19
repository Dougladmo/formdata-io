import type { FormDataPayload, FormDataValue, PayloadOptions } from './types';
import {
  isFileOrBlob,
  isPlainObject,
  valueToString,
  buildFieldName,
} from './utils';

const DEFAULT_OPTIONS: PayloadOptions = {
  indices: false,
  nullsAsUndefineds: false,
  booleansAsIntegers: true,
};

/**
 * Converts a JavaScript object to FormData
 *
 * @param data - Object to be converted
 * @param options - Configuration options
 * @returns FormData instance ready for submission
 *
 * @example
 * ```typescript
 * const formData = payload({
 *   name: "João Silva",
 *   age: 25,
 *   avatar: fileInput.files[0],
 *   tags: ["admin", "user"],
 *   metadata: { source: "web" }
 * });
 *
 * // Use with fetch
 * fetch('/upload', { method: 'POST', body: formData });
 *
 * // Use with axios
 * axios.post('/upload', formData);
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * const formData = payload(data, {
 *   indices: true,           // tags[0]=admin&tags[1]=user
 *   booleansAsIntegers: false // active=true instead of active=1
 * });
 * ```
 */
export function payload(
  data: FormDataPayload,
  options: Partial<PayloadOptions> = {}
): FormData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const formData = new FormData();

  /**
   * Recursively append values to FormData
   *
   * @param key - Field name
   * @param value - Value to append
   */
  function append(key: string, value: unknown): void {
    // Case 1: File or Blob - direct append (terminal case)
    if (isFileOrBlob(value)) {
      formData.append(key, value);
      return;
    }

    // Case 2: Array - recurse with optional indexing
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const fieldName = buildFieldName(key, index, opts);
        append(fieldName, item);
      });
      return;
    }

    // Case 3: Plain object - serialize as JSON (terminal case)
    if (isPlainObject(value)) {
      const jsonString = JSON.stringify(value);
      formData.append(key, jsonString);
      return;
    }

    // Case 4: Primitives (string, number, boolean, null, undefined, Date).
    // At this point File/Blob, Array, and plain object have all been handled,
    // so value is guaranteed to be a FormDataValue primitive.
    const stringValue = valueToString(value as FormDataValue, opts);
    if (stringValue !== undefined) {
      formData.append(key, stringValue);
    }
  }

  // Iterate over root-level keys
  Object.entries(data).forEach(([key, value]) => {
    append(key, value);
  });

  return formData;
}
