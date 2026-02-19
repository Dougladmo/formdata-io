# 🚀 FormData IO

> TypeScript-first library for seamless FormData handling in frontend and backend — plus cloud storage for AWS S3 and Supabase.

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

// Storage: Upload to S3 or Supabase in one line
const result = await storage.upload(avatar);
console.log(result.url); // "https://bucket.s3.us-east-1.amazonaws.com/..."
```

## Installation

```bash
npm install formdata-io
```

**Optional peer dependencies** (install only what you need):

```bash
# For AWS S3 storage
npm install @aws-sdk/client-s3

# Supabase Storage uses native fetch — no extra dependencies needed
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

### Storage (AWS S3 or Supabase)

```typescript
import { parser } from 'formdata-io/server';
import { createStorage } from 'formdata-io/storage';

const storage = createStorage({
  provider: 'aws',
  bucket: process.env.AWS_BUCKET!,
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

app.post('/api/upload', parser(), async (req, res) => {
  const { avatar } = req.payload;
  const result = await storage.upload(avatar);
  res.json({ url: result.url });
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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxFileSize` | `number` | `10485760` (10MB) | Max size per file in bytes |
| `maxFiles` | `number` | `10` | Max number of files per request |
| `maxFields` | `number` | `100` | Max number of text fields per request |
| `maxFieldSize` | `number` | `65536` (64KB) | Max size of each text field in bytes |
| `maxTotalFileSize` | `number` | `Infinity` | Combined size limit for all files in bytes |
| `autoParseJSON` | `boolean` | `true` | Auto-parse JSON strings to objects |
| `autoParseNumbers` | `boolean` | `true` | Auto-convert numeric strings to numbers |
| `autoParseBooleans` | `boolean` | `true` | Auto-convert "true"/"false" to booleans |

**Examples:**

```typescript
// Default options (10MB per file, 10 files, 100 fields)
app.post('/upload', parser(), (req, res) => {
  // req.payload contains all fields and files
});

// Custom file size limit
app.post('/photos', parser({ maxFileSize: 50 * 1024 * 1024 }), (req, res) => {
  // Allow up to 50MB files
});

// Cap total upload size (e.g. gallery endpoint)
app.post('/gallery', parser({ maxTotalFileSize: 100 * 1024 * 1024 }), (req, res) => {
  // All files combined must be under 100MB
});

// Limit text fields to prevent DoS
app.post('/form', parser({ maxFields: 20, maxFieldSize: 8 * 1024 }), (req, res) => {
  // Max 20 fields, each up to 8KB
});

// Disable auto-parsing
app.post('/raw', parser({ autoParseJSON: false }), (req, res) => {
  // All fields remain as strings
});
```

#### `parseMultipart(req, options?)`

Lower-level function that parses a multipart request and returns a promise — useful when you need direct control outside of Express middleware.

```typescript
import { parseMultipart } from 'formdata-io/server';

// Inside a custom handler or framework adapter
const payload = await parseMultipart(req, { maxFiles: 5 });
console.log(payload.avatar); // ParsedFile
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

### Storage API

The `formdata-io/storage` package provides a unified adapter for uploading and deleting files on AWS S3 and Supabase Storage.

#### `createStorage(config)`

Factory function that returns a `StorageAdapter` for the configured provider.

```typescript
import { createStorage } from 'formdata-io/storage';

const storage = createStorage(config);
```

**AWS S3 config:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | `'aws'` | ✅ | Provider identifier |
| `bucket` | `string` | ✅ | S3 bucket name |
| `region` | `string` | ✅ | AWS region (e.g. `'us-east-1'`) |
| `accessKeyId` | `string` | ✅ | AWS access key ID |
| `secretAccessKey` | `string` | ✅ | AWS secret access key |
| `sessionToken` | `string` | — | STS/IAM temporary session token |
| `endpoint` | `string` | — | Custom endpoint for S3-compatible providers |
| `keyPrefix` | `string` | — | Default path prefix for all keys |
| `acl` | `'public-read' \| 'private'` | — | Object ACL (see note below) |

> **ACL note:** Since April 2023, new S3 buckets have Object Ownership set to "Bucket owner enforced", which disables ACLs entirely. Setting `acl` on such buckets throws an `AccessControlListNotSupported` error. Either remove the `acl` option or change the bucket's Object Ownership setting in the S3 console.

```typescript
// .env
// AWS_BUCKET=my-bucket
// AWS_REGION=us-east-1
// AWS_ACCESS_KEY_ID=AKIA...
// AWS_SECRET_ACCESS_KEY=...

const storage = createStorage({
  provider: 'aws',
  bucket: process.env.AWS_BUCKET!,
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  keyPrefix: 'uploads',
});
```

**Supabase Storage config:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | `'supabase'` | ✅ | Provider identifier |
| `bucket` | `string` | ✅ | Supabase storage bucket name |
| `url` | `string` | ✅ | Supabase project URL |
| `serviceKey` | `string` | ✅ | Supabase service role key |
| `keyPrefix` | `string` | — | Default path prefix for all keys |
| `publicBucket` | `boolean` | — | Whether the bucket is public (default: `true`) |

> When `publicBucket` is `true`, `UploadResult.url` is the full public URL. When `false`, `url` contains only the storage key and you are responsible for generating a signed URL via the Supabase client before serving the file.

```typescript
// .env
// SUPABASE_URL=https://xyz.supabase.co
// SUPABASE_SERVICE_KEY=eyJ...

const storage = createStorage({
  provider: 'supabase',
  bucket: 'avatars',
  url: process.env.SUPABASE_URL!,
  serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  keyPrefix: 'users',
});
```

#### `storage.upload(input, options?)`

Uploads a single file and returns an `UploadResult`.

**`UploadInput`** — accepts three forms:
- `ParsedFile` — file parsed by `parser()` middleware (preferred)
- `Buffer` — raw buffer (requires `filename` in options)
- `string` — base64 data URI (requires `filename` in options)

**`UploadOptions`:**

| Field | Type | Description |
|-------|------|-------------|
| `filename` | `string` | Required for Buffer and base64 inputs |
| `mimetype` | `string` | Override detected MIME type |
| `keyPrefix` | `string` | Override key prefix for this upload only |

**`UploadResult`:**

```typescript
interface UploadResult {
  url: string;      // Public URL (or key for private Supabase buckets)
  key: string;      // Storage key: "{prefix}/{uuid}-{sanitized-filename}"
  size: number;     // File size in bytes
  mimetype: string; // MIME type
}
```

**Examples:**

```typescript
// Upload a ParsedFile from parser()
const result = await storage.upload(req.payload.avatar);
console.log(result.url);     // "https://bucket.s3.us-east-1.amazonaws.com/uploads/abc-avatar.jpg"
console.log(result.key);     // "uploads/abc123-avatar.jpg"
console.log(result.size);    // 204800
console.log(result.mimetype); // "image/jpeg"

// Upload a Buffer
const result = await storage.upload(buffer, {
  filename: 'report.pdf',
  mimetype: 'application/pdf',
});

// Upload a base64 data URI
const result = await storage.upload(dataUri, { filename: 'photo.png' });
```

#### `storage.uploadMany(inputs, options?)`

Uploads multiple files in parallel and returns an array of `UploadResult`.

```typescript
const files = [req.payload.photo1, req.payload.photo2, req.payload.photo3];
const results = await storage.uploadMany(files);
// → [{ url, key, size, mimetype }, ...]
```

#### `storage.delete(key)`

Deletes a file by its storage key.

```typescript
await storage.delete('uploads/abc123-avatar.jpg');
```

#### End-to-end Express example

```typescript
import express from 'express';
import { parser } from 'formdata-io/server';
import { createStorage } from 'formdata-io/storage';

const app = express();

const storage = createStorage({
  provider: 'aws',
  bucket: process.env.AWS_BUCKET!,
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  keyPrefix: 'avatars',
});

app.post('/api/profile', parser({ maxFileSize: 5 * 1024 * 1024 }), async (req, res) => {
  try {
    const { name, avatar } = req.payload;

    const uploaded = await storage.upload(avatar);

    res.json({
      name,
      avatarUrl: uploaded.url,
      avatarKey: uploaded.key,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
```

#### S3-compatible providers (MinIO, Cloudflare R2, etc.)

Pass a custom `endpoint` to use any S3-compatible storage service:

```typescript
// MinIO
const storage = createStorage({
  provider: 'aws',
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: process.env.MINIO_ACCESS_KEY!,
  secretAccessKey: process.env.MINIO_SECRET_KEY!,
  endpoint: 'http://localhost:9000',
});

// Cloudflare R2
const storage = createStorage({
  provider: 'aws',
  bucket: 'my-bucket',
  region: 'auto',
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});
```

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import type { ParsedFile } from 'formdata-io/server';
import type { UploadResult } from 'formdata-io/storage';

app.post('/upload', parser(), async (req, res) => {
  const avatar = req.payload?.avatar as ParsedFile;

  avatar.buffer;       // Buffer
  avatar.originalname; // string
  avatar.mimetype;     // string
  avatar.size;         // number

  const result: UploadResult = await storage.upload(avatar);
  result.url;          // string
  result.key;          // string
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
| Cloud storage | ✅ | ❌ | ❌ | ❌ |
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
2. **Size limits**: Enforced per-file, per-field, and total file size limits
3. **Auto-parsing**: Automatic type conversion (JSON, numbers, booleans)
4. **Array normalization**: Multiple values with same key become arrays

### Storage Side

The `createStorage()` factory returns a provider-agnostic `StorageAdapter`:

1. **Unified interface**: Same `upload` / `uploadMany` / `delete` API across providers
2. **Key generation**: Storage keys use `{prefix}/{uuid}-{sanitized-filename}` format, with NFD normalization to produce readable keys from accented filenames
3. **Lazy loading**: The AWS SDK is loaded on first upload, keeping startup time unaffected if storage is unused
4. **Input flexibility**: Accepts `ParsedFile`, raw `Buffer`, or base64 data URI as upload input

## Security

**Built-in protections:**
- ✅ File size limits (default: 10MB per file)
- ✅ File count limits (default: 10 files max)
- ✅ Text field limits (default: 100 fields, 64KB each)
- ✅ Total file size limit (configurable via `maxTotalFileSize`)
- ✅ Stream-based processing (no memory exhaustion)
- ✅ Safe JSON parsing (fallback to string on error)
- ✅ ReDoS protection for base64 parsing (regex runs in isolated `vm` context with 50ms timeout, throws `RegExpTimeoutError` on timeout)
- ✅ Storage key sanitization (NFD normalization + accent stripping + alphanumeric enforcement prevents path traversal)

**Your responsibility:**
- ⚠️ File type validation (check `mimetype` and magic bytes)
- ⚠️ Virus scanning (if accepting user files)
- ⚠️ Storage permissions (S3 bucket policies, Supabase RLS)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Credits

Built with [busboy](https://github.com/mscdex/busboy) for multipart parsing.
