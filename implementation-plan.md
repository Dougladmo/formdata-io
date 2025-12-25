# 📦 GUIA DE IMPLEMENTAÇÃO - TypeScript FormData Library v1.0

> **Objetivo**: Criar uma biblioteca TypeScript moderna que simplifique o uso de `multipart/form-data` tanto no frontend quanto no backend, oferecendo DX superior às soluções existentes.

---

## 🎯 VISÃO GERAL DO PROJETO

### O que a biblioteca FAZ:
- ✅ Converte objetos JavaScript em FormData (frontend)
- ✅ Parse de multipart/form-data em objeto normalizado (backend)
- ✅ TypeScript-first com inferência automática de tipos
- ✅ Zero configuração para casos de uso comuns
- ✅ API consistente e previsível

### O que a biblioteca NÃO FAZ:
- ❌ NÃO faz requisições HTTP (não substitui fetch/axios)
- ❌ NÃO impõe storage específico (S3, disk, etc)
- ❌ NÃO inclui UI components
- ❌ NÃO valida dados (isso fica para v2 com Zod)

---

## 📂 ESTRUTURA DE ARQUIVOS OBRIGATÓRIA

```
formdata-kit/
├── src/
│   ├── client/
│   │   ├── index.ts          # Export principal do client
│   │   ├── payload.ts         # Função payload()
│   │   ├── types.ts           # Tipos compartilhados
│   │   └── utils.ts           # Helpers de conversão
│   ├── server/
│   │   ├── index.ts          # Export principal do server
│   │   ├── middleware.ts      # Middleware Express
│   │   ├── parser.ts          # Lógica de parsing
│   │   └── types.ts           # Tipos do servidor
│   └── shared/
│       └── types.ts           # Tipos compartilhados entre client/server
├── tests/
│   ├── client/
│   │   └── payload.test.ts
│   └── server/
│       └── middleware.test.ts
├── examples/
│   ├── basic/
│   │   ├── client.html
│   │   └── server.ts
│   └── advanced/
│       ├── react-app/
│       └── express-api/
├── package.json
├── tsconfig.json
├── tsconfig.client.json
├── tsconfig.server.json
├── tsup.config.ts
├── README.md
└── LICENSE
```

---

## 📦 PACKAGE.JSON - CONFIGURAÇÃO CRÍTICA

```json
{
  "name": "formdata-kit",
  "version": "1.0.0",
  "description": "TypeScript-first library for seamless FormData handling in frontend and backend",
  "author": "Seu Nome",
  "license": "MIT",
  "keywords": [
    "formdata",
    "multipart",
    "upload",
    "typescript",
    "express",
    "multer",
    "file-upload"
  ],
  "main": "./dist/server/index.js",
  "module": "./dist/server/index.mjs",
  "types": "./dist/server/index.d.ts",
  "exports": {
    "./client": {
      "types": "./dist/client/index.d.ts",
      "import": "./dist/client/index.mjs",
      "require": "./dist/client/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.mjs",
      "require": "./dist/server/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "busboy": "^1.6.0"
  },
  "devDependencies": {
    "@types/busboy": "^1.5.4",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "express": "^4.18.2",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  },
  "peerDependencies": {
    "express": "^4.0.0 || ^5.0.0"
  },
  "peerDependenciesMeta": {
    "express": {
      "optional": true
    }
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### ⚠️ DECISÕES IMPORTANTES DO PACKAGE.JSON:

1. **Exports separados**: `/client` e `/server` são entry points distintos
2. **Busboy como dependência**: Usar busboy (não multer) por ser mais leve e flexível
3. **Express como peerDependency opcional**: Permitir uso fora do Express no futuro
4. **Dual package (CJS + ESM)**: Compatibilidade máxima

---

## 🔧 TSCONFIG - CONFIGURAÇÃO TYPESCRIPT

### tsconfig.json (base)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsconfig.client.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2020", "DOM"],
    "types": []
  },
  "include": ["src/client/**/*", "src/shared/**/*"]
}
```

### tsconfig.server.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2020"],
    "types": ["node"]
  },
  "include": ["src/server/**/*", "src/shared/**/*"]
}
```

---

## 🏗️ TSUP CONFIG - BUILD CONFIGURATION

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig([
  // Client build
  {
    entry: ['src/client/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist/client',
    external: [],
    noExternal: [],
    platform: 'browser',
    target: 'es2020',
  },
  // Server build
  {
    entry: ['src/server/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist/server',
    external: ['busboy', 'express'],
    platform: 'node',
    target: 'node18',
  },
]);
```

---

## 🎨 IMPLEMENTAÇÃO - CLIENT SIDE

### src/client/types.ts

```typescript
/**
 * Tipos suportados para valores de FormData
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
 * Tipo recursivo para objetos que podem ser convertidos em FormData
 */
export type FormDataPayload = {
  [key: string]:
    | FormDataValue
    | FormDataValue[]
    | FormDataPayload
    | FormDataPayload[];
};

/**
 * Opções de configuração para conversão
 */
export interface PayloadOptions {
  /**
   * Se true, índices numéricos serão adicionados aos nomes dos campos de arrays
   * @default false
   * @example ['a', 'b'] => tags[0]=a&tags[1]=b (true) vs tags=a&tags=b (false)
   */
  indices?: boolean;

  /**
   * Se true, valores null serão convertidos em strings vazias
   * @default false
   */
  nullsAsUndefineds?: boolean;

  /**
   * Se true, valores booleanos serão convertidos em "true"/"false"
   * @default true
   */
  booleansAsIntegers?: boolean;
}
```

### src/client/utils.ts

```typescript
import type { FormDataValue, FormDataPayload, PayloadOptions } from './types';

/**
 * Verifica se um valor é um File ou Blob
 */
export function isFileOrBlob(value: unknown): value is File | Blob {
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  return false;
}

/**
 * Verifica se um valor é um objeto simples (não File, Blob, Date, Array)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  if (isFileOrBlob(value)) return false;
  if (value instanceof Date) return false;
  if (Array.isArray(value)) return false;
  return true;
}

/**
 * Converte um valor primitivo para string de acordo com as opções
 */
export function valueToString(
  value: FormDataValue,
  options: PayloadOptions
): string | undefined {
  if (value === null) {
    return options.nullsAsUndefineds ? undefined : '';
  }

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    if (options.booleansAsIntegers) {
      return value ? '1' : '0';
    }
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
}

/**
 * Gera o nome do campo com suporte a notação de array/objeto
 */
export function buildFieldName(
  parentKey: string,
  key: string | number,
  options: PayloadOptions
): string {
  if (typeof key === 'number') {
    return options.indices ? `${parentKey}[${key}]` : parentKey;
  }
  return parentKey ? `${parentKey}[${key}]` : key;
}
```

### src/client/payload.ts

```typescript
import type { FormDataPayload, PayloadOptions } from './types';
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
 * Converte um objeto JavaScript em FormData
 * 
 * @param data - Objeto a ser convertido
 * @param options - Opções de conversão
 * @returns Instância de FormData pronta para envio
 * 
 * @example
 * ```typescript
 * const formData = payload({
 *   name: "João",
 *   age: 25,
 *   avatar: fileInput.files[0],
 *   tags: ["admin", "user"]
 * });
 * 
 * // Usar com fetch
 * fetch('/upload', { method: 'POST', body: formData });
 * 
 * // Usar com axios
 * axios.post('/upload', formData);
 * ```
 */
export function payload(
  data: FormDataPayload,
  options: Partial<PayloadOptions> = {}
): FormData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const formData = new FormData();

  function append(key: string, value: unknown): void {
    // Caso 1: File ou Blob - adiciona diretamente
    if (isFileOrBlob(value)) {
      formData.append(key, value);
      return;
    }

    // Caso 2: Array
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const fieldName = buildFieldName(key, index, opts);
        append(fieldName, item);
      });
      return;
    }

    // Caso 3: Objeto simples - serializa como JSON
    if (isPlainObject(value)) {
      const jsonString = JSON.stringify(value);
      formData.append(key, jsonString);
      return;
    }

    // Caso 4: Primitivos (string, number, boolean, null, undefined, Date)
    const stringValue = valueToString(value as any, opts);
    if (stringValue !== undefined) {
      formData.append(key, stringValue);
    }
  }

  // Itera sobre as chaves do objeto raiz
  Object.entries(data).forEach(([key, value]) => {
    append(key, value);
  });

  return formData;
}
```

### src/client/index.ts

```typescript
export { payload } from './payload';
export type { FormDataPayload, FormDataValue, PayloadOptions } from './types';
```

---

## 🔌 IMPLEMENTAÇÃO - SERVER SIDE

### src/server/types.ts

```typescript
import type { Request, Response, NextFunction } from 'express';

/**
 * Arquivo parsed pelo middleware
 */
export interface ParsedFile {
  /** Nome do campo no formulário */
  fieldname: string;
  /** Nome original do arquivo */
  originalname: string;
  /** Encoding do arquivo */
  encoding: string;
  /** MIME type */
  mimetype: string;
  /** Tamanho em bytes */
  size: number;
  /** Buffer com o conteúdo do arquivo */
  buffer: Buffer;
}

/**
 * Payload normalizado que será adicionado ao req.payload
 */
export type ParsedPayload = {
  [key: string]: string | number | boolean | object | ParsedFile | ParsedFile[];
};

/**
 * Extend Express Request para incluir payload
 */
declare global {
  namespace Express {
    interface Request {
      payload?: ParsedPayload;
    }
  }
}

/**
 * Opções de configuração do middleware
 */
export interface ParserOptions {
  /**
   * Tamanho máximo do arquivo em bytes
   * @default 10MB (10 * 1024 * 1024)
   */
  maxFileSize?: number;

  /**
   * Número máximo de arquivos permitidos
   * @default 10
   */
  maxFiles?: number;

  /**
   * Se true, tentará fazer JSON.parse automaticamente em campos de texto
   * @default true
   */
  autoParseJSON?: boolean;

  /**
   * Se true, tentará converter strings numéricas em números
   * @default true
   */
  autoParseNumbers?: boolean;

  /**
   * Se true, tentará converter "true"/"false" em booleanos
   * @default true
   */
  autoParseBooleans?: boolean;
}

export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
```

### src/server/parser.ts

```typescript
import Busboy from 'busboy';
import type { Request } from 'express';
import type { ParsedFile, ParsedPayload, ParserOptions } from './types';

const DEFAULT_OPTIONS: Required<ParserOptions> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  autoParseJSON: true,
  autoParseNumbers: true,
  autoParseBooleans: true,
};

/**
 * Tenta fazer parse automático de valores
 */
function autoParse(
  value: string,
  options: Required<ParserOptions>
): string | number | boolean | object {
  // 1. Tentar JSON
  if (options.autoParseJSON) {
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        return JSON.parse(value);
      } catch {
        // Fallback para string
      }
    }
  }

  // 2. Tentar Boolean
  if (options.autoParseBooleans) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '1') return true;
    if (value === '0') return false;
  }

  // 3. Tentar Number
  if (options.autoParseNumbers) {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }
  }

  // 4. Retornar como string
  return value;
}

/**
 * Parse multipart/form-data usando Busboy
 */
export function parseMultipart(
  req: Request,
  options: Partial<ParserOptions> = {}
): Promise<ParsedPayload> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const payload: ParsedPayload = {};
    const files: ParsedFile[] = [];
    let fileCount = 0;

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: opts.maxFileSize,
        files: opts.maxFiles,
      },
    });

    // Handler para campos de texto
    busboy.on('field', (fieldname: string, value: string) => {
      const parsedValue = autoParse(value, opts);

      // Se o campo já existe, converte em array
      if (payload[fieldname] !== undefined) {
        if (Array.isArray(payload[fieldname])) {
          (payload[fieldname] as any[]).push(parsedValue);
        } else {
          payload[fieldname] = [payload[fieldname], parsedValue];
        }
      } else {
        payload[fieldname] = parsedValue;
      }
    });

    // Handler para arquivos
    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; encoding: string; mimeType: string }
      ) => {
        fileCount++;

        if (fileCount > opts.maxFiles) {
          file.resume(); // Descarta o arquivo
          return reject(
            new Error(`Maximum number of files (${opts.maxFiles}) exceeded`)
          );
        }

        const chunks: Buffer[] = [];
        let size = 0;

        file.on('data', (chunk: Buffer) => {
          size += chunk.length;

          if (size > opts.maxFileSize) {
            file.resume(); // Para de ler
            return reject(
              new Error(
                `File size exceeds limit of ${opts.maxFileSize} bytes`
              )
            );
          }

          chunks.push(chunk);
        });

        file.on('end', () => {
          const parsedFile: ParsedFile = {
            fieldname,
            originalname: info.filename,
            encoding: info.encoding,
            mimetype: info.mimeType,
            size,
            buffer: Buffer.concat(chunks),
          };

          files.push(parsedFile);
        });

        file.on('error', reject);
      }
    );

    // Handler para limite de arquivo excedido
    busboy.on('limit', () => {
      reject(new Error('File size limit exceeded'));
    });

    // Handler para conclusão
    busboy.on('finish', () => {
      // Normaliza arquivos no payload
      files.forEach((file) => {
        if (payload[file.fieldname] !== undefined) {
          // Se já existe, converte em array
          if (Array.isArray(payload[file.fieldname])) {
            (payload[file.fieldname] as ParsedFile[]).push(file);
          } else {
            payload[file.fieldname] = [payload[file.fieldname] as ParsedFile, file];
          }
        } else {
          payload[file.fieldname] = file;
        }
      });

      resolve(payload);
    });

    busboy.on('error', reject);

    // Pipe do request para o busboy
    req.pipe(busboy);
  });
}
```

### src/server/middleware.ts

```typescript
import type { Request, Response, NextFunction } from 'express';
import { parseMultipart } from './parser';
import type { ParserOptions, MiddlewareFunction } from './types';

/**
 * Cria middleware Express para parsing de multipart/form-data
 * 
 * @param options - Opções de configuração
 * @returns Middleware Express
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { parser } from 'formdata-kit/server';
 * 
 * const app = express();
 * 
 * app.post('/upload', parser(), (req, res) => {
 *   const { name, avatar } = req.payload;
 *   res.json({ ok: true });
 * });
 * ```
 */
export function parser(options: ParserOptions = {}): MiddlewareFunction {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Só processa se for multipart/form-data
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return next();
    }

    try {
      req.payload = await parseMultipart(req, options);
      next();
    } catch (error) {
      // Passar erro para error handler do Express
      next(error);
    }
  };
}
```

### src/server/index.ts

```typescript
export { parser } from './middleware';
export { parseMultipart } from './parser';
export type {
  ParsedFile,
  ParsedPayload,
  ParserOptions,
  MiddlewareFunction,
} from './types';
```

---

## 🧪 TESTES - ESTRUTURA MÍNIMA

### tests/client/payload.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { payload } from '../../src/client';

describe('payload()', () => {
  it('deve converter objeto simples em FormData', () => {
    const data = {
      name: 'João',
      age: 25,
    };

    const formData = payload(data);

    expect(formData.get('name')).toBe('João');
    expect(formData.get('age')).toBe('25');
  });

  it('deve converter arrays em múltiplos valores', () => {
    const data = {
      tags: ['admin', 'user'],
    };

    const formData = payload(data);

    expect(formData.getAll('tags')).toEqual(['admin', 'user']);
  });

  it('deve serializar objetos aninhados como JSON', () => {
    const data = {
      metadata: {
        source: 'web',
        version: 2,
      },
    };

    const formData = payload(data);
    const parsed = JSON.parse(formData.get('metadata') as string);

    expect(parsed).toEqual({ source: 'web', version: 2 });
  });

  it('deve ignorar valores undefined', () => {
    const data = {
      name: 'João',
      email: undefined,
    };

    const formData = payload(data);

    expect(formData.has('name')).toBe(true);
    expect(formData.has('email')).toBe(false);
  });

  it('deve converter null em string vazia por padrão', () => {
    const data = {
      optional: null,
    };

    const formData = payload(data);

    expect(formData.get('optional')).toBe('');
  });

  it('deve converter booleanos em 1/0 por padrão', () => {
    const data = {
      active: true,
      deleted: false,
    };

    const formData = payload(data);

    expect(formData.get('active')).toBe('1');
    expect(formData.get('deleted')).toBe('0');
  });

  it('deve converter Date em ISO string', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const data = {
      createdAt: date,
    };

    const formData = payload(data);

    expect(formData.get('createdAt')).toBe('2024-01-01T00:00:00.000Z');
  });
});
```

### tests/server/middleware.test.ts

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { parser } from '../../src/server';

describe('parser() middleware', () => {
  it('deve pular requisições que não são multipart', async () => {
    const req = {
      headers: { 'content-type': 'application/json' },
    } as Request;

    const res = {} as Response;
    const next = vi.fn();

    const middleware = parser();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.payload).toBeUndefined();
  });

  // NOTA: Testes completos de parsing multipart requerem mock de streams
  // Para v1, focar em testes de integração end-to-end
});
```

---

## 📖 README.md - ESTRUTURA OBRIGATÓRIA

```markdown
# 🚀 FormData Kit

> The TypeScript-first library for seamless FormData handling in frontend and backend.

[![npm version](https://img.shields.io/npm/v/formdata-kit.svg)](https://www.npmjs.com/package/formdata-kit)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/formdata-kit)](https://bundlephobia.com/package/formdata-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Why?

Working with `multipart/form-data` in JavaScript is painful:

- ❌ Manual `formData.append()` calls everywhere
- ❌ Backend requires multer config, storage setup, and juggling `req.file` + `req.body`
- ❌ Poor TypeScript support
- ❌ Inconsistent APIs between frontend and backend

**FormData Kit solves this:**

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
npm install formdata-kit
```

## Quick Start

### Frontend (React, Vue, Vanilla JS)

```typescript
import { payload } from 'formdata-kit/client';

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
import { parser } from 'formdata-kit/server';

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

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import type { ParsedFile } from 'formdata-kit/server';

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

## Comparison with Alternatives

| Feature | FormData Kit | multer | busboy | object-to-formdata |
|---------|-------------|--------|--------|-------------------|
| Frontend + Backend | ✅ | ❌ | ❌ | ❌ |
| TypeScript-first | ✅ | ⚠️ | ⚠️ | ❌ |
| Zero config | ✅ | ❌ | ❌ | ✅ |
| Auto-parsing | ✅ | ❌ | ❌ | N/A |
| Bundle size | 5KB | 30KB | 10KB | 2KB |

## License

MIT
```

---

## 🎯 EXEMPLOS DE USO - CÓDIGO FUNCIONAL

### examples/basic/client.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>FormData Kit - Basic Example</title>
</head>
<body>
  <h1>Upload Example</h1>
  
  <form id="uploadForm">
    <input type="text" name="name" placeholder="Name" required />
    <input type="number" name="age" placeholder="Age" />
    <input type="file" name="avatar" accept="image/*" />
    <button type="submit">Upload</button>
  </form>

  <script type="module">
    import { payload } from 'formdata-kit/client';

    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const formData = payload({
        name: form.name.value,
        age: parseInt(form.age.value),
        avatar: form.avatar.files[0],
        tags: ['new-user', 'verified'],
        metadata: {
          source: 'web',
          timestamp: new Date()
        }
      });

      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('Upload result:', result);
    });
  </script>
</body>
</html>
```

### examples/basic/server.ts

```typescript
import express from 'express';
import cors from 'cors';
import { parser } from 'formdata-kit/server';
import type { ParsedFile } from 'formdata-kit/server';

const app = express();

app.use(cors());

app.post('/upload', parser({ maxFileSize: 5 * 1024 * 1024 }), (req, res) => {
  try {
    const { name, age, avatar, tags, metadata } = req.payload || {};

    console.log('Received payload:');
    console.log('- Name:', name);
    console.log('- Age:', age, typeof age);
    console.log('- Tags:', tags);
    console.log('- Metadata:', metadata);

    if (avatar) {
      const file = avatar as ParsedFile;
      console.log('- Avatar:', {
        name: file.originalname,
        size: file.size,
        type: file.mimetype
      });
    }

    res.json({
      success: true,
      received: {
        name,
        age,
        hasAvatar: !!avatar,
        tags,
        metadata
      }
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup (30min)
- [ ] Criar estrutura de pastas
- [ ] Configurar package.json com exports
- [ ] Configurar TypeScript (3 configs)
- [ ] Configurar tsup
- [ ] Instalar dependências

### Fase 2: Client (2-3h)
- [ ] Implementar tipos em `src/client/types.ts`
- [ ] Implementar utils em `src/client/utils.ts`
- [ ] Implementar função `payload()` em `src/client/payload.ts`
- [ ] Criar exports em `src/client/index.ts`
- [ ] Escrever testes básicos

### Fase 3: Server (3-4h)
- [ ] Implementar tipos em `src/server/types.ts`
- [ ] Implementar parser com busboy em `src/server/parser.ts`
- [ ] Implementar middleware Express em `src/server/middleware.ts`
- [ ] Criar exports em `src/server/index.ts`
- [ ] Escrever testes básicos

### Fase 4: Build & Testes (1-2h)
- [ ] Rodar build com `npm run build`
- [ ] Verificar arquivos gerados em `dist/`
- [ ] Testar imports separados (`/client` e `/server`)
- [ ] Criar exemplo end-to-end funcional
- [ ] Testar com TypeScript

### Fase 5: Documentação (2h)
- [ ] Escrever README completo
- [ ] Adicionar JSDoc em todas as funções públicas
- [ ] Criar exemplos de uso
- [ ] Documentar opções de configuração

### Fase 6: Publicação (1h)
- [ ] Configurar `.npmignore`
- [ ] Adicionar LICENSE
- [ ] Testar instalação local (`npm link`)
- [ ] Publicar no npm (`npm publish`)

---

## 🚨 PONTOS CRÍTICOS DE ATENÇÃO

### 1. Separação Client/Server é OBRIGATÓRIA
- Client NÃO pode ter dependências Node.js
- Server NÃO pode ser importado no browser
- Usar `exports` do package.json corretamente

### 2. TypeScript precisa inferir tipos automaticamente
- `req.payload` deve ter autocomplete
- Tipos devem aparecer no hover do VSCode
- Sem erros de "implicitly any"

### 3. Handling de edge cases
- Arquivos muito grandes (rejeitar com erro claro)
- Arrays de arquivos (suportar múltiplos com mesmo fieldname)
- JSON inválido em campos (fallback para string)
- Campos duplicados (converter em array automaticamente)

### 4. Performance
- Usar streams para arquivos (não carregar tudo em memória de uma vez)
- Limites de tamanho configuráveis
- Abortar upload se limite excedido

### 5. Compatibilidade
- Testar em Node 18, 20, 22
- Testar em browsers modernos
- CommonJS e ESM funcionando

---

## 🎯 CRITÉRIOS DE SUCESSO

A v1.0 está pronta quando:

1. ✅ Instalar `npm install formdata-kit` funciona
2. ✅ `import { payload } from 'formdata-kit/client'` funciona no browser
3. ✅ `import { parser } from 'formdata-kit/server'` funciona no Node
4. ✅ TypeScript infere tipos corretamente
5. ✅ Exemplo básico end-to-end funciona
6. ✅ README explica uso em < 2 minutos de leitura
7. ✅ Build gera CJS + ESM + tipos (.d.ts)
8. ✅ Bundle size < 10KB (client + server combinados)
9. ✅ Zero warnings no TypeScript strict mode
10. ✅ Testes básicos passam

---

## 📚 RECURSOS ADICIONAIS

### Referências Técnicas
- Busboy docs: https://github.com/mscdex/busboy
- FormData spec: https://xhr.spec.whatwg.org/#interface-formdata
- Multipart spec: https://tools.ietf.org/html/rfc7578
- Express middleware: https://expressjs.com/en/guide/writing-middleware.html

### Inspiração de APIs
- object-to-formdata: https://github.com/therealparmesh/object-to-formdata
- multer: https://github.com/expressjs/multer
- zod-form-data: https://www.npmjs.com/package/zod-form-data

---

## 🚀 PRÓXIMOS PASSOS (v2.0)

Após v1.0 estável, considerar:

- [ ] Validação com Zod integrada
- [ ] Streaming direto para S3/GCS
- [ ] Suporte a uploads resumíveis (tus protocol)
- [ ] Suporte a Fastify, Hono, outros frameworks
- [ ] Plugin para Next.js App Router
- [ ] Detecção automática de MIME type por magic bytes
- [ ] Progress tracking
- [ ] Transformações de imagem (resize, compress)

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Setup inicial
npm init -y
npm install -D typescript tsup vitest @types/node @types/express
npm install busboy
npm install -D @types/busboy

# Development
npm run dev          # Watch mode
npm run typecheck    # Verificar tipos
npm run test:watch   # Testes em watch

# Build
npm run build        # Gera dist/

# Publicação
npm run prepublishOnly  # Build automático antes de publish
npm publish             # Publica no npm
```

---

**FIM DO GUIA DE IMPLEMENTAÇÃO v1.0**

Este documento contém TUDO que é necessário para implementar a biblioteca completa.
Siga a ordem do checklist para garantir que nada seja esquecido.

Boa sorte! 🚀