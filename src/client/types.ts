/**
 * Base64-encoded data URI string format
 *
 * @example "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
 */
export type Base64String = `data:${string};base64,${string}`;

/**
 * Supported value types for FormData conversion
 */
export type FormDataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | File
  | Blob
  | Date;

/**
 * Recursive type for objects that can be converted to FormData
 *
 * Supports nested objects and arrays, with automatic serialization
 */
export type FormDataPayload = {
  [key: string]:
    | FormDataValue
    | FormDataValue[]
    | FormDataPayload
    | FormDataPayload[];
};

/**
 * Configuration options for FormData conversion
 */
export interface PayloadOptions {
  /**
   * Add numeric indices to array field names
   *
   * @default false
   *
   * @example
   * ```typescript
   * // indices: false → tags=a&tags=b
   * // indices: true → tags[0]=a&tags[1]=b
   * ```
   */
  indices?: boolean;

  /**
   * Skip null values instead of converting to empty strings
   *
   * @default false
   *
   * @example
   * ```typescript
   * // nullsAsUndefineds: false → optional=""
   * // nullsAsUndefineds: true → optional field not sent
   * ```
   */
  nullsAsUndefineds?: boolean;

  /**
   * Convert boolean values to 1/0 instead of true/false
   *
   * @default true
   *
   * @example
   * ```typescript
   * // booleansAsIntegers: true → active=1
   * // booleansAsIntegers: false → active=true
   * ```
   */
  booleansAsIntegers?: boolean;
}
