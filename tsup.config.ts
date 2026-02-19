import { defineConfig } from 'tsup';

export default defineConfig([
  // Client build (browser)
  {
    entry: ['src/client/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist/client',
    platform: 'browser',
    target: 'es2020',
    external: [],
    treeshake: true,
  },
  // Server build (Node.js)
  {
    entry: ['src/server/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    outDir: 'dist/server',
    platform: 'node',
    target: 'node18',
    external: ['busboy', 'express'],
    treeshake: true,
  },
  // Storage build (Node.js)
  {
    entry: ['src/storage/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    outDir: 'dist/storage',
    platform: 'node',
    target: 'node18',
    external: ['@aws-sdk/client-s3'],
    treeshake: true,
  },
]);
