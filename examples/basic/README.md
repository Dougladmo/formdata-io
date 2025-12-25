# FormData IO - React Example

Exemplo React + Express comparando **formdata-io** vs **abordagem genérica** lado a lado.

## 📁 Estrutura

```
examples/basic/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── FormDataIOUpload.tsx    # Implementação A
│   │   │   └── GenericUpload.tsx        # Implementação B
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/           # Express API
│   ├── server.ts      # 2 endpoints de comparação
│   └── package.json
└── README.md
```

## 🚀 Instalação e Execução

### 1. Instalar dependências

```bash
# Na raiz do exemplo (examples/basic/)
npm install
npm run install:all
```

### 2. Rodar frontend e backend simultaneamente

```bash
npm run dev
```

Isso inicia:
- ✅ Frontend (Vite): http://localhost:5173
- ✅ Backend (Express): http://localhost:3000

### Ou rodar separadamente:

**Terminal 1 - Frontend:**
```bash
npm run dev:frontend
```

**Terminal 2 - Backend:**
```bash
npm run dev:backend
```

## 🔍 API Endpoints

### POST /upload-formdata-io (Implementação A)
```typescript
// Usa parser() do formdata-io
// ✅ req.payload.age é NUMBER
// ✅ req.payload.metadata é OBJECT
// ✅ req.payload.tags é ARRAY
// 🔥 MANIPULAÇÃO: Salva arquivo em backend/uploads/
```

### POST /upload-generic (Implementação B)
```typescript
// Usa multer tradicional
// ⚠️ req.body.age é STRING
// ⚠️ req.body.metadata é STRING (precisa JSON.parse)
// ⚠️ req.body.tags é STRING (precisa JSON.parse)
// 🔥 MANIPULAÇÃO: Salva arquivo em backend/uploads/
```

## 📊 Comparação Rápida

| Aspecto | formdata-io | Genérico |
|---------|-------------|----------|
| **Linhas de Código** | **60 linhas** (frontend + backend) | **85 linhas** (+42% mais código) |
| **Client** | `payload({ age: 25 })` | `formData.append('age', '25')` |
| **Objetos** | Automático | `JSON.stringify()` manual |
| **Arrays** | Automático | `JSON.stringify()` manual |
| **Server** | `req.payload.age` (number) | `req.body.age` (string) |
| **Parsing** | Zero boilerplate | 13+ linhas extras (try/catch + JSON.parse) |

📄 **Veja comparação completa em [COMPARISON.md](./COMPARISON.md)**

## 💡 Como Usar

1. Abra http://localhost:5173
2. Preencha o formulário em **ambas** as seções
3. **Selecione uma imagem** para fazer upload
4. Clique em "Upload" em cada uma
5. Compare os resultados:
   - **formdata-io**: Tipos automáticos (age é number, metadata é object)
   - **Genérico**: Tudo string (precisa conversão manual)
6. Veja os logs:
   - **Console do navegador** (F12): Logs do frontend
   - **Terminal do backend**: Logs do servidor
7. **Verifique os arquivos salvos** em `backend/uploads/`:
   - `formdata-io-{timestamp}-{filename}` (Implementação A)
   - `generic-{timestamp}-{filename}` (Implementação B)

## 🔥 Manipulação de Arquivos

Ambas as implementações demonstram manipulação real do buffer:

```typescript
// formdata-io
const file = avatar as ParsedFile;
fs.writeFileSync(savedFilePath, file.buffer); // ✅ Buffer disponível

// generic (multer)
fs.writeFileSync(savedFilePath, avatar.buffer); // ✅ Buffer disponível
```

**Logs no backend mostram:**
```
✅ Avatar recebido: { name, size, type, bufferLength }
💾 Arquivo salvo em: /path/to/backend/uploads/formdata-io-123456-image.jpg
🔧 Buffer manipulado com sucesso! Tamanho: 123456 bytes
```

Os arquivos são salvos em `backend/uploads/` para você verificar que a imagem foi recebida e manipulada corretamente.

## 🎯 Objetivo do Exemplo

Demonstrar visualmente que **formdata-io**:
- ✅ Reduz código boilerplate
- ✅ Converte tipos automaticamente
- ✅ Suporta objetos e arrays sem serialização manual
- ✅ Melhora DX (Developer Experience)

## 🔧 Troubleshooting

**"Cannot find module 'formdata-io/client'"**
- Certifique-se de buildar a lib principal: `npm run build` na raiz do projeto

**"CORS errors"**
- O backend deve estar rodando na porta 3000
- Vite proxy cuida do CORS automaticamente
