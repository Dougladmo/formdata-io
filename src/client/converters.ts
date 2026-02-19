import type { Base64String } from './types'

const DATA_URI_MAX_LENGTH = 100 * 1024 * 1024; // 100 MB
const REGEX_TIMEOUT_MS = 100;

// Runs a regex with performance.now() timeout detection.
// In browsers, synchronous regexes cannot be interrupted mid-run;
// the real protection is the input size limit above.
function matchWithTimeout(
  input: string,
  pattern: RegExp,
  timeoutMs = REGEX_TIMEOUT_MS
): RegExpMatchArray | null {
  if (input.length > DATA_URI_MAX_LENGTH) {
    throw new Error(
      `Input length (${input.length}) exceeds maximum allowed (${DATA_URI_MAX_LENGTH} bytes)`
    );
  }
  const start = performance.now()
  const result = input.match(pattern)
  const elapsed = performance.now() - start
  if (elapsed > timeoutMs) {
    throw new Error(`RegExp execution timed out after ${timeoutMs}ms`)
  }
  return result
}

export async function fileToBase64(file: File | Blob): Promise<Base64String> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      resolve(result as Base64String)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

export function base64ToBlob(dataUri: Base64String): Blob {
  const parts = dataUri.split(',')
  if (parts.length !== 2) {
    throw new Error('Invalid data URI format')
  }

  const header = parts[0]
  const base64Data = parts[1]

  if (!header.includes(';base64')) {
    throw new Error(
      'Invalid data URI: only base64-encoded data URIs are supported. ' +
        'Expected format: data:{mimetype};base64,{data}'
    )
  }

  const mimeMatch = matchWithTimeout(header, /:(.*?);/)
  if (!mimeMatch) {
    throw new Error('Invalid data URI: missing MIME type')
  }

  const mimeType = mimeMatch[1]

  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return new Blob([bytes], { type: mimeType })
}

export function base64ToFile(dataUri: Base64String, filename: string): File {
  const blob = base64ToBlob(dataUri)
  return new File([blob], filename, { type: blob.type })
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

export function fileToBlob(file: File): Blob {
  return new Blob([file], { type: file.type })
}
