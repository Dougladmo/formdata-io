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

export function payload(
  data: FormDataPayload,
  options: Partial<PayloadOptions> = {}
): FormData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const formData = new FormData();

  function append(key: string, value: unknown): void {
    if (isFileOrBlob(value)) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const fieldName = buildFieldName(key, index, opts);
        append(fieldName, item);
      });
      return;
    }

    if (isPlainObject(value)) {
      const jsonString = JSON.stringify(value);
      formData.append(key, jsonString);
      return;
    }

    const stringValue = valueToString(value as FormDataValue, opts);
    if (stringValue !== undefined) {
      formData.append(key, stringValue);
    }
  }

  Object.entries(data).forEach(([key, value]) => {
    append(key, value);
  });

  return formData;
}
