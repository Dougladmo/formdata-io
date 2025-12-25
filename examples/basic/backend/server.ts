import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parser } from '../../../dist/server/index.js';
import type { ParsedFile } from '../../../dist/server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// ============================================================================
// GENERIC: Setup necessário - 3 linhas extras de configuração
// ============================================================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});


// ============================================================================
// IMPLEMENTATION A: formdata-io
// Total: ~25 linhas de código útil
// ============================================================================
app.post(
  '/upload-formdata-io',
  parser({ maxFileSize: 5 * 1024 * 1024 }),
  (req: Request, res: Response) => {
    try {
      // ✅ TIPOS AUTOMÁTICOS: age é number, tags é array, metadata é object
      const { name, age, avatar, tags, metadata } = req.payload || {};

      let fileInfo = null;

      if (avatar && 'buffer' in avatar) {
        const file = avatar as ParsedFile;
        const filename = `formdata-io-${Date.now()}-${file.originalname}`;
        const savedFilePath = path.join(uploadsDir, filename);

        fs.writeFileSync(savedFilePath, file.buffer);

        fileInfo = {
          originalName: file.originalname,
          savedAs: filename,
          size: file.size,
          mimetype: file.mimetype
        };
      }

      res.json({
        success: true,
        received: { name, age, ageType: typeof age, hasAvatar: !!avatar, tags, metadata, fileInfo }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Upload failed' });
    }
  }
);


// ============================================================================
// IMPLEMENTATION B: Generic approach with multer
// Total: ~40 linhas de código útil (60% mais código!)
// ============================================================================
app.post(
  '/upload-generic',
  upload.single('avatar'),
  (req: Request, res: Response) => {
    try {
      // ⚠️ TIPOS NÃO CONVERTIDOS: age é string, tags é string, metadata é string
      const { name, age, tags, metadata } = req.body;
      const avatar = req.file;

      let fileInfo = null;

      if (avatar) {
        const filename = `generic-${Date.now()}-${avatar.originalname}`;
        const savedFilePath = path.join(uploadsDir, filename);

        fs.writeFileSync(savedFilePath, avatar.buffer);

        fileInfo = {
          originalName: avatar.originalname,
          savedAs: filename,
          size: avatar.size,
          mimetype: avatar.mimetype
        };
      }

      // 🔧 PARSING MANUAL NECESSÁRIO: código extra para converter tipos
      let parsedTags;
      let parsedMetadata;
      let parsedAge;

      try {
        parsedTags = tags ? JSON.parse(tags) : [];
        parsedMetadata = metadata ? JSON.parse(metadata) : {};
        parsedAge = age ? parseInt(age, 10) : undefined;
      } catch (e) {
        // Se parsing falhar, manter como string (comportamento inconsistente)
        parsedTags = tags;
        parsedMetadata = metadata;
        parsedAge = age;
      }

      res.json({
        success: true,
        received: {
          name,
          age: parsedAge, // Precisa conversão manual
          ageType: typeof parsedAge,
          hasAvatar: !!avatar,
          tags: parsedTags, // Precisa JSON.parse manual
          metadata: parsedMetadata, // Precisa JSON.parse manual
          fileInfo
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Upload failed' });
    }
  }
);


// ============================================================================
// COMPARAÇÃO DIRETA:
//
// formdata-io:
// - 25 linhas de código
// - Tipos automáticos (age: number, tags: array, metadata: object)
// - Sem código de parsing manual
// - Menos propenso a erros
//
// Generic (multer):
// - 40 linhas de código (+60% mais código)
// - Tipos manuais (age: string, tags: string, metadata: string)
// - 13 linhas extras para parsing manual (try/catch + JSON.parse + parseInt)
// - Mais propenso a erros (parsing pode falhar)
// - Comportamento inconsistente em caso de erro
// ============================================================================


app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'FormData IO React Example Server',
    endpoints: {
      formdata_io: '/upload-formdata-io',
      generic: '/upload-generic'
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Frontend: http://localhost:5173\n`);
});
