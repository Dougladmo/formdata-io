import { describe, it, expect } from 'vitest';
import {
  fileToBase64,
  base64ToBlob,
  base64ToFile,
  blobToFile,
  fileToBlob,
} from '../../src/client/converters';
import type { Base64String } from '../../src/client/types';

describe('fileToBase64', () => {
  it('converts a text file to base64', async () => {
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const base64 = await fileToBase64(file);

    expect(base64).toMatch(/^data:text\/plain;base64,/);
    expect(base64).toContain('aGVsbG8gd29ybGQ='); // "hello world" in base64
  });

  it('converts an image blob to base64', async () => {
    const imageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
    const blob = new Blob([imageData], { type: 'image/png' });
    const base64 = await fileToBase64(blob);

    expect(base64).toMatch(/^data:image\/png;base64,/);
  });

  it('preserves MIME type for PDF', async () => {
    const pdfData = '%PDF-1.4 content';
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const base64 = await fileToBase64(blob);

    expect(base64).toMatch(/^data:application\/pdf;base64,/);
  });

  it('preserves MIME type for CSV', async () => {
    const csvData = 'name,age\nJohn,25';
    const blob = new Blob([csvData], { type: 'text/csv' });
    const base64 = await fileToBase64(blob);

    expect(base64).toMatch(/^data:text\/csv;base64,/);
  });

  it('preserves MIME type for DOCX', async () => {
    const docxData = 'PK...'; // DOCX files are ZIP archives
    const blob = new Blob([docxData], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const base64 = await fileToBase64(blob);

    expect(base64).toMatch(
      /^data:application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document;base64,/
    );
  });

  it('preserves MIME type for SVG', async () => {
    const svgData = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const base64 = await fileToBase64(blob);

    expect(base64).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});

describe('base64ToBlob', () => {
  it('converts base64 string to blob', () => {
    const base64: Base64String = 'data:text/plain;base64,aGVsbG8gd29ybGQ=';
    const blob = base64ToBlob(base64);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('extracts correct MIME type for image', () => {
    const base64: Base64String = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const blob = base64ToBlob(base64);

    expect(blob.type).toBe('image/jpeg');
  });

  it('extracts correct MIME type for PDF', () => {
    const base64: Base64String = 'data:application/pdf;base64,JVBERi0xLjQ=';
    const blob = base64ToBlob(base64);

    expect(blob.type).toBe('application/pdf');
  });

  it('throws error for invalid data URI format', () => {
    const invalid = 'not-a-data-uri' as Base64String;
    expect(() => base64ToBlob(invalid)).toThrow('Invalid data URI format');
  });

  it('throws error for missing MIME type', () => {
    const invalid = 'data:base64,aGVsbG8=' as Base64String;
    expect(() => base64ToBlob(invalid)).toThrow('Invalid data URI: missing MIME type');
  });
});

describe('base64ToFile', () => {
  it('converts base64 string to File with filename', () => {
    const base64: Base64String = 'data:text/plain;base64,aGVsbG8gd29ybGQ=';
    const file = base64ToFile(base64, 'test.txt');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.txt');
    expect(file.type).toBe('text/plain');
    expect(file.size).toBeGreaterThan(0);
  });

  it('preserves MIME type in File object', () => {
    const base64: Base64String = 'data:image/png;base64,iVBORw0KGgo=';
    const file = base64ToFile(base64, 'image.png');

    expect(file.type).toBe('image/png');
  });

  it('creates File with custom filename', () => {
    const base64: Base64String = 'data:application/pdf;base64,JVBERi0=';
    const file = base64ToFile(base64, 'document.pdf');

    expect(file.name).toBe('document.pdf');
  });
});

describe('blobToFile', () => {
  it('converts Blob to File with filename', () => {
    const blob = new Blob(['content'], { type: 'text/plain' });
    const file = blobToFile(blob, 'test.txt');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.txt');
    expect(file.type).toBe('text/plain');
    expect(file.size).toBe(blob.size);
  });

  it('preserves Blob content in File', async () => {
    const content = 'hello world';
    const blob = new Blob([content], { type: 'text/plain' });
    const file = blobToFile(blob, 'test.txt');

    const text = await file.text();
    expect(text).toBe(content);
  });

  it('preserves MIME type', () => {
    const blob = new Blob(['data'], { type: 'application/json' });
    const file = blobToFile(blob, 'data.json');

    expect(file.type).toBe('application/json');
  });
});

describe('fileToBlob', () => {
  it('converts File to Blob', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const blob = fileToBlob(file);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(file.size);
  });

  it('preserves File content in Blob', async () => {
    const content = 'hello world';
    const file = new File([content], 'test.txt', { type: 'text/plain' });
    const blob = fileToBlob(file);

    const text = await blob.text();
    expect(text).toBe(content);
  });

  it('preserves MIME type', () => {
    const file = new File(['{}'], 'data.json', { type: 'application/json' });
    const blob = fileToBlob(file);

    expect(blob.type).toBe('application/json');
  });
});

describe('bidirectional conversion', () => {
  it('File → base64 → File roundtrip preserves data', async () => {
    const original = new File(['hello world'], 'test.txt', { type: 'text/plain' });

    const base64 = await fileToBase64(original);
    const restored = base64ToFile(base64, 'test.txt');

    expect(restored.name).toBe(original.name);
    expect(restored.type).toBe(original.type);
    expect(restored.size).toBe(original.size);

    const originalText = await original.text();
    const restoredText = await restored.text();
    expect(restoredText).toBe(originalText);
  });

  it('Blob → base64 → Blob roundtrip preserves data', async () => {
    const original = new Blob(['test data'], { type: 'application/octet-stream' });

    const base64 = await fileToBase64(original);
    const restored = base64ToBlob(base64);

    expect(restored.type).toBe(original.type);
    expect(restored.size).toBe(original.size);

    const originalText = await original.text();
    const restoredText = await restored.text();
    expect(restoredText).toBe(originalText);
  });

  it('File → Blob → File roundtrip preserves data', async () => {
    const original = new File(['content'], 'test.txt', { type: 'text/plain' });

    const blob = fileToBlob(original);
    const restored = blobToFile(blob, 'test.txt');

    expect(restored.name).toBe(original.name);
    expect(restored.type).toBe(original.type);
    expect(restored.size).toBe(original.size);

    const originalText = await original.text();
    const restoredText = await restored.text();
    expect(restoredText).toBe(originalText);
  });

  it('handles binary data in roundtrip conversions', async () => {
    const binaryData = new Uint8Array([0, 1, 2, 255, 254, 253]);
    const original = new Blob([binaryData], { type: 'application/octet-stream' });

    const base64 = await fileToBase64(original);
    const restored = base64ToBlob(base64);

    expect(restored.size).toBe(original.size);

    const originalBuffer = await original.arrayBuffer();
    const restoredBuffer = await restored.arrayBuffer();

    const originalArray = new Uint8Array(originalBuffer);
    const restoredArray = new Uint8Array(restoredBuffer);

    expect(restoredArray).toEqual(originalArray);
  });

  it('preserves complex MIME types', async () => {
    const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const original = new Blob(['docx content'], { type: mimeType });

    const base64 = await fileToBase64(original);
    const restored = base64ToBlob(base64);

    expect(restored.type).toBe(mimeType);
  });
});

describe('edge cases', () => {
  it('handles empty files', async () => {
    const file = new File([], 'empty.txt', { type: 'text/plain' });
    const base64 = await fileToBase64(file);
    const restored = base64ToFile(base64, 'empty.txt');

    expect(restored.size).toBe(0);
  });

  it('handles large content', async () => {
    const largeContent = 'a'.repeat(10000);
    const file = new File([largeContent], 'large.txt', { type: 'text/plain' });

    const base64 = await fileToBase64(file);
    const restored = base64ToFile(base64, 'large.txt');

    const restoredText = await restored.text();
    expect(restoredText).toBe(largeContent);
  });

  it('handles special characters', async () => {
    const specialChars = '🎉 Hello! @#$%^&*() 中文 العربية';
    const file = new File([specialChars], 'special.txt', { type: 'text/plain' });

    const base64 = await fileToBase64(file);
    const restored = base64ToFile(base64, 'special.txt');

    const restoredText = await restored.text();
    expect(restoredText).toBe(specialChars);
  });

  it('handles blobs without explicit MIME type', async () => {
    const blob = new Blob(['content']);
    const base64 = await fileToBase64(blob);

    expect(base64).toMatch(/^data:/);
    expect(base64).toContain('base64');
  });
});
