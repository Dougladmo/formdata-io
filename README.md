# 🚀 FormData IO

> TypeScript-first library for seamless FormData handling in frontend and backend.

[![npm version](https://img.shields.io/npm/v/formdata-io.svg)](https://www.npmjs.com/package/formdata-io)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/formdata-io)](https://bundlephobia.com/package/formdata-io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Why?

Working with `multipart/form-data` in JavaScript is painful:

- ❌ Manual `formData.append()` calls everywhere
- ❌ Backend requires multer config, storage setup, and juggling `req.file` + `req.body`
- ❌ Poor TypeScript support
- ❌ Inconsistent APIs between frontend and backend

**FormData IO solves this:**

```typescript
// Frontend: Write objects, not append calls
const formData = payload({ name: "João", avatar: file });

// Backend: Receive normalized payload, not scattered data
app.post('/upload', parser(), (req, res) => {
  const { name, avatar } = req.payload; // ✨ Type-safe!
});
```

## Installation

```bash
npm install formdata-io
```

## Quick Start

### Frontend (React, Vue, Vanilla JS)

```typescript
import { payload } from 'formdata-io/client';

const formData = payload({
  name: "João Silva",
  age: 25,
  avatar: fileInput.files[0],
  tags: ["admin", "user"],
  metadata: { source: "web" }
});

// Use with fetch
fetch('/api/upload', {
  method: 'POST',
  body: formData
});

// Or with axios
axios.post('/api/upload', formData);
```

### Backend (Express)

```typescript
import express from 'express';
import { parser } from 'formdata-io/server';

const app = express();

app.post('/api/upload', parser(), (req, res) => {
  const { name, age, avatar, tags, metadata } = req.payload;

  console.log(name);     // "João Silva"
  console.log(age);      // 25 (auto-parsed as number)
  console.log(avatar);   // { buffer: Buffer, originalname: "...", ... }
  console.log(tags);     // ["admin", "user"]
  console.log(metadata); // { source: "web" } (auto-parsed JSON)

  res.json({ success: true });
});
```

## API Reference

### Client API

#### `payload(data, options?)`

Converts a JavaScript object to FormData.

**Parameters:**
- `data: FormDataPayload` - Object to convert
- `options?: PayloadOptions` - Configuration options

**Returns:** `FormData`

**Options:**
```typescript
{
  indices: boolean;          // Add indices to array fields (default: false)
  nullsAsUndefineds: boolean; // Skip null values (default: false)
  booleansAsIntegers: boolean; // Convert true/false to 1/0 (default: true)
}
```

**Examples:**

```typescript
// Basic usage
const formData = payload({
  name: "User",
  file: document.querySelector('input[type="file"]').files[0]
});

// With arrays
const formData = payload({
  tags: ["admin", "user"] // → tags=admin&tags=user
});

// With indices
const formData = payload(
  { tags: ["admin", "user"] },
  { indices: true } // → tags[0]=admin&tags[1]=user
);

// Nested objects (auto-serialized as JSON)
const formData = payload({
  metadata: { source: "web", version: 2 }
  // → metadata='{"source":"web","version":2}'
});

// Date handling
const formData = payload({
  createdAt: new Date() // → createdAt='2024-01-01T00:00:00.000Z'
});
```

#### Base64 Converters

Utilities for bidirectional conversion between Files/Blobs and base64 strings, giving you flexibility to choose between FormData/multipart or JSON/base64 approaches.

**`fileToBase64(file: File | Blob): Promise<Base64String>`**

Converts File or Blob to base64 data URI with MIME type preservation.

```typescript
import { fileToBase64 } from 'formdata-io/client';

const file = new File(['content'], 'doc.txt', { type: 'text/plain' });
const base64 = await fileToBase64(file);
// → "data:text/plain;base64,Y29udGVudA=="

// Use in JSON API (no FormData/multipart)
await fetch('/api/user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'João', avatar: base64 })
});
```

**`base64ToBlob(dataUri: Base64String): Blob`**

Converts base64 data URI to Blob with MIME type extraction.

```typescript
import { base64ToBlob } from 'formdata-io/client';

const dataUri = "data:image/png;base64,iVBORw0KG...";
const blob = base64ToBlob(dataUri);
// → Blob { type: "image/png", size: 1234 }
```

**`base64ToFile(dataUri: Base64String, filename: string): File`**

Converts base64 data URI to File with filename and metadata.

```typescript
import { base64ToFile } from 'formdata-io/client';

const dataUri = "data:application/pdf;base64,JVBERi0x...";
const file = base64ToFile(dataUri, 'document.pdf');
// → File { name: "document.pdf", type: "application/pdf" }
```

**`blobToFile(blob: Blob, filename: string): File`**

Converts Blob to File with specified filename.

```typescript
import { blobToFile } from 'formdata-io/client';

const blob = new Blob(['content'], { type: 'text/plain' });
const file = blobToFile(blob, 'output.txt');
// → File { name: "output.txt", type: "text/plain" }
```

**`fileToBlob(file: File): Blob`**

Converts File to Blob for type conversion.

```typescript
import { fileToBlob } from 'formdata-io/client';

const file = new File(['data'], 'file.txt', { type: 'text/plain' });
const blob = fileToBlob(file);
// → Blob { type: "text/plain", size: 4 }
```

**Supported Formats:**
- ✅ Images: JPEG, PNG, SVG, WebP, GIF
- ✅ Documents: PDF, DOCX, XLSX, PPTX
- ✅ Text files: CSV, TXT, JSON, XML
- ✅ Media: Video (MP4, WebM), Audio (MP3, WAV)
- ✅ Any Blob/File type with MIME type preservation

**Use Cases:**

```typescript
// Option 1: JSON API (no FormData/multipart)
import { fileToBase64 } from 'formdata-io/client';

const avatar = await fileToBase64(file);
await fetch('/api/user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'João', avatar })
});

// Option 2: Traditional multipart (existing behavior)
import { payload } from 'formdata-io/client';

const formData = payload({ avatar: file });
await fetch('/api/upload', { method: 'POST', body: formData });

// Bidirectional conversion (File → base64 → File roundtrip)
import { fileToBase64, base64ToFile } from 'formdata-io/client';

const original = new File(['content'], 'test.txt', { type: 'text/plain' });
const base64 = await fileToBase64(original);
const restored = base64ToFile(base64, 'test.txt');
```

### Server API

#### `parser(options?)`

Express middleware for parsing multipart/form-data.

**Parameters:**
- `options?: ParserOptions` - Configuration options

**Returns:** Express middleware function

**Options:**
```typescript
{
  maxFileSize: number;      // Max file size in bytes (default: 10MB)
  maxFiles: number;         // Max number of files (default: 10)
  autoParseJSON: boolean;   // Auto-parse JSON strings (default: true)
  autoParseNumbers: boolean; // Auto-convert numeric strings (default: true)
  autoParseBooleans: boolean; // Auto-convert "true"/"false" (default: true)
}
```

**Examples:**

```typescript
// Default options (10MB, 10 files)
app.post('/upload', parser(), (req, res) => {
  // req.payload contains all fields and files
});

// Custom file size limit
app.post('/photos', parser({ maxFileSize: 50 * 1024 * 1024 }), (req, res) => {
  // Allow up to 50MB files
});

// Disable auto-parsing
app.post('/raw', parser({ autoParseJSON: false }), (req, res) => {
  // All fields remain as strings
});
```

#### `ParsedFile` Interface

```typescript
interface ParsedFile {
  fieldname: string;    // Form field name
  originalname: string; // Original filename
  encoding: string;     // File encoding
  mimetype: string;     // MIME type
  size: number;         // File size in bytes
  buffer: Buffer;       // File data
}
```

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import type { ParsedFile } from 'formdata-io/server';

app.post('/upload', parser(), (req, res) => {
  const avatar = req.payload?.avatar as ParsedFile;

  avatar.buffer;       // Buffer
  avatar.originalname; // string
  avatar.mimetype;     // string
  avatar.size;         // number
});
```

## Examples

See the [examples](./examples) directory for complete working examples.

**Run the example:**

```bash
# Terminal 1: Start the server
npm run build
node examples/basic/server.ts

# Terminal 2: Open client.html in your browser
open examples/basic/client.html
```

## Comparison with Alternatives

| Feature | FormData IO | multer | busboy | object-to-formdata |
|---------|-------------|--------|--------|-------------------|
| Frontend + Backend | ✅ | ❌ | ❌ | ❌ |
| TypeScript-first | ✅ | ⚠️ | ⚠️ | ❌ |
| Zero config | ✅ | ❌ | ❌ | ✅ |
| Auto-parsing | ✅ | ❌ | ❌ | N/A |
| Bundle size | ~6KB | ~30KB | ~10KB | ~2KB |

## How It Works

### Client Side

The `payload()` function converts JavaScript objects to FormData by:

1. **File/Blob detection**: Directly appends File and Blob objects
2. **Array handling**: Supports both flat (`tags=a&tags=b`) and indexed (`tags[0]=a`) formats
3. **Object serialization**: Nested objects are JSON-serialized
4. **Type conversion**: Booleans, numbers, dates converted to strings

**Base64 Converters** provide alternative file handling:

1. **Bidirectional conversion**: File ↔ Base64 ↔ Blob transformations
2. **MIME type preservation**: Data URIs maintain original file types
3. **JSON API support**: Enable file uploads via JSON payloads
4. **Flexibility**: Choose between FormData/multipart or JSON/base64 approaches

### Server Side

The `parser()` middleware uses [busboy](https://github.com/mscdex/busboy) for stream-based parsing:

1. **Stream processing**: Memory-efficient file handling
2. **Size limits**: Enforced per-file and total limits
3. **Auto-parsing**: Automatic type conversion (JSON, numbers, booleans)
4. **Array normalization**: Multiple values with same key become arrays

## Security

**Built-in protections:**
- ✅ File size limits (default: 10MB per file)
- ✅ File count limits (default: 10 files max)
- ✅ Stream-based processing (no memory exhaustion)
- ✅ Safe JSON parsing (fallback to string on error)

**Your responsibility:**
- ⚠️ File type validation (check `mimetype` and magic bytes)
- ⚠️ Filename sanitization (prevent path traversal)
- ⚠️ Virus scanning (if accepting user files)
- ⚠️ Storage security (S3 permissions, disk quotas)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Credits

Built with [busboy](https://github.com/mscdex/busboy) for multipart parsing.
