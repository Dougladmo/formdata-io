import type { Base64String } from './types'

const DATA_URI_MAX_LENGTH = 100 * 1024 * 1024; // 100 MB
const REGEX_TIMEOUT_MS = 100; // 100 ms — threshold para detecção no browser

/**
 * Executa um regex com detecção de timeout via performance.now().
 * Importante: no browser não é possível interromper um regex síncrono em execução;
 * o erro é lançado *após* a execução terminar, não durante. A proteção real é o
 * limite de tamanho da entrada — entradas grandes são rejeitadas antes do match.
 * Também rejeita entradas acima do tamanho máximo permitido.
 */
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

/**
 * Converts a File or Blob to a base64-encoded data URI string.
 *
 * @param file - The File or Blob to convert
 * @returns Promise resolving to a data URI string (e.g., "data:image/png;base64,...")
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'example.txt', { type: 'text/plain' })
 * const base64 = await fileToBase64(file)
 * // "data:text/plain;base64,Y29udGVudA=="
 * ```
 */
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

/**
 * Converts a base64 data URI string to a Blob.
 *
 * @param dataUri - Base64 data URI string (e.g., "data:image/png;base64,...")
 * @returns Blob object with the decoded data and MIME type
 *
 * @example
 * ```typescript
 * const blob = base64ToBlob("data:text/plain;base64,Y29udGVudA==")
 * // Blob { type: 'text/plain', size: 7 }
 * ```
 */
export function base64ToBlob(dataUri: Base64String): Blob {
  // Extract MIME type and base64 data
  const parts = dataUri.split(',')
  if (parts.length !== 2) {
    throw new Error('Invalid data URI format')
  }

  const header = parts[0]
  const base64Data = parts[1]

  // Fix #12: reject non-base64 data URIs (e.g. data:text/plain;charset=utf-8,hello)
  // before calling atob(), which would throw a cryptic DOMException.
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

  // Decode base64 to binary
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return new Blob([bytes], { type: mimeType })
}

/**
 * Converts a base64 data URI string to a File object.
 *
 * @param dataUri - Base64 data URI string (e.g., "data:image/png;base64,...")
 * @param filename - Name for the created File object
 * @returns File object with the decoded data, MIME type, and filename
 *
 * @example
 * ```typescript
 * const file = base64ToFile("data:text/plain;base64,Y29udGVudA==", "example.txt")
 * // File { name: 'example.txt', type: 'text/plain', size: 7 }
 * ```
 */
export function base64ToFile(dataUri: Base64String, filename: string): File {
  const blob = base64ToBlob(dataUri)
  return new File([blob], filename, { type: blob.type })
}

/**
 * Converts a Blob to a File object with a specified filename.
 *
 * @param blob - Blob to convert
 * @param filename - Name for the created File object
 * @returns File object with the same content and MIME type as the Blob
 *
 * @example
 * ```typescript
 * const blob = new Blob(['content'], { type: 'text/plain' })
 * const file = blobToFile(blob, 'example.txt')
 * // File { name: 'example.txt', type: 'text/plain', size: 7 }
 * ```
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

/**
 * Converts a File to a Blob (utility function for type conversion).
 *
 * @param file - File to convert
 * @returns Blob with the same content and MIME type as the File
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'example.txt', { type: 'text/plain' })
 * const blob = fileToBlob(file)
 * // Blob { type: 'text/plain', size: 7 }
 * ```
 */
export function fileToBlob(file: File): Blob {
  return new Blob([file], { type: file.type })
}
