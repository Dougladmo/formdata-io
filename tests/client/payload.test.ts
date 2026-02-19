import { describe, it, expect } from 'vitest';
import { payload } from '../../src/client';

describe('payload() - Core Functionality', () => {
  it('should convert simple object to FormData', () => {
    const data = {
      name: 'João',
      age: 25,
    };

    const formData = payload(data);

    expect(formData.get('name')).toBe('João');
    expect(formData.get('age')).toBe('25');
  });

  it('should handle numbers correctly', () => {
    const data = {
      age: 25,
      price: 99.99,
      zero: 0,
    };

    const formData = payload(data);

    expect(formData.get('age')).toBe('25');
    expect(formData.get('price')).toBe('99.99');
    expect(formData.get('zero')).toBe('0');
  });

  it('should handle booleans as 1/0 by default', () => {
    const data = {
      active: true,
      deleted: false,
    };

    const formData = payload(data);

    expect(formData.get('active')).toBe('1');
    expect(formData.get('deleted')).toBe('0');
  });

  it('should handle booleans as true/false when configured', () => {
    const data = {
      active: true,
      deleted: false,
    };

    const formData = payload(data, { booleansAsIntegers: false });

    expect(formData.get('active')).toBe('true');
    expect(formData.get('deleted')).toBe('false');
  });

  it('should convert arrays without indices by default', () => {
    const data = {
      tags: ['admin', 'user'],
    };

    const formData = payload(data);

    expect(formData.getAll('tags')).toEqual(['admin', 'user']);
  });

  it('should convert arrays with indices when configured', () => {
    const data = {
      tags: ['admin', 'user'],
    };

    const formData = payload(data, { indices: true });

    expect(formData.get('tags[0]')).toBe('admin');
    expect(formData.get('tags[1]')).toBe('user');
  });

  it('should serialize nested objects as JSON', () => {
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

  it('should ignore undefined values', () => {
    const data = {
      name: 'João',
      email: undefined,
    };

    const formData = payload(data);

    expect(formData.has('name')).toBe(true);
    expect(formData.has('email')).toBe(false);
  });

  it('should convert null to empty string by default', () => {
    const data = {
      optional: null,
    };

    const formData = payload(data);

    expect(formData.get('optional')).toBe('');
  });

  it('should skip null when nullsAsUndefineds is true', () => {
    const data = {
      optional: null,
    };

    const formData = payload(data, { nullsAsUndefineds: true });

    expect(formData.has('optional')).toBe(false);
  });

  it('should convert Date to ISO string', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const data = {
      createdAt: date,
    };

    const formData = payload(data);

    expect(formData.get('createdAt')).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should handle empty arrays', () => {
    const data = {
      tags: [],
    };

    const formData = payload(data);

    expect(formData.getAll('tags')).toEqual([]);
  });

  it('should handle mixed-type arrays', () => {
    const data = {
      items: ['string', 123, true],
    };

    const formData = payload(data);
    const items = formData.getAll('items');

    expect(items).toEqual(['string', '123', '1']);
  });

  it('should handle deeply nested objects', () => {
    const data = {
      deep: {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      },
    };

    const formData = payload(data);
    const parsed = JSON.parse(formData.get('deep') as string);

    expect(parsed.level1.level2.value).toBe('deep');
  });

  it('should handle arrays of objects', () => {
    const data = {
      items: [
        { name: 'Item 1' },
        { name: 'Item 2' },
      ],
    };

    const formData = payload(data);
    const items = formData.getAll('items');

    expect(items.length).toBe(2);
    expect(JSON.parse(items[0] as string)).toEqual({ name: 'Item 1' });
    expect(JSON.parse(items[1] as string)).toEqual({ name: 'Item 2' });
  });

  it('should handle NaN and Infinity', () => {
    const data = {
      nan: NaN,
      infinity: Infinity,
      negInfinity: -Infinity,
    };

    const formData = payload(data);

    expect(formData.get('nan')).toBe('NaN');
    expect(formData.get('infinity')).toBe('Infinity');
    expect(formData.get('negInfinity')).toBe('-Infinity');
  });

  it('should handle empty object', () => {
    const data = {};

    const formData = payload(data);

    expect([...formData.keys()]).toEqual([]);
  });

  it('should handle objects with only undefined values', () => {
    const data = {
      a: undefined,
      b: undefined,
    };

    const formData = payload(data);

    expect([...formData.keys()]).toEqual([]);
  });
});

describe('payload() - Blob Compatibility', () => {
  it('should handle PDF blobs', () => {
    const pdfBlob = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });
    const data = {
      resume: pdfBlob,
    };

    const formData = payload(data);
    const result = formData.get('resume');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'application/pdf');
    expect(result).toHaveProperty('size', pdfBlob.size);
  });

  it('should handle DOCX blobs', () => {
    const docxBlob = new Blob(['PK...'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const data = {
      contract: docxBlob,
    };

    const formData = payload(data);
    const result = formData.get('contract');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(result).toHaveProperty('size', docxBlob.size);
  });

  it('should handle CSV blobs', () => {
    const csvBlob = new Blob(['name,age\nJohn,25'], { type: 'text/csv' });
    const data = {
      report: csvBlob,
    };

    const formData = payload(data);
    const result = formData.get('report');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'text/csv');
    expect(result).toHaveProperty('size', csvBlob.size);
  });

  it('should handle image blobs (JPEG)', () => {
    const jpegBlob = new Blob(['fake jpeg data'], { type: 'image/jpeg' });
    const data = {
      photo: jpegBlob,
    };

    const formData = payload(data);
    const result = formData.get('photo');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'image/jpeg');
    expect(result).toHaveProperty('size', jpegBlob.size);
  });

  it('should handle image blobs (PNG)', () => {
    const pngBlob = new Blob(['fake png data'], { type: 'image/png' });
    const data = {
      logo: pngBlob,
    };

    const formData = payload(data);
    const result = formData.get('logo');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'image/png');
    expect(result).toHaveProperty('size', pngBlob.size);
  });

  it('should handle SVG blobs', () => {
    const svgBlob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
    const data = {
      icon: svgBlob,
    };

    const formData = payload(data);
    const result = formData.get('icon');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'image/svg+xml');
    expect(result).toHaveProperty('size', svgBlob.size);
  });

  it('should handle mixed Files and Blobs', () => {
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const blob = new Blob(['doc'], { type: 'application/pdf' });
    const data = {
      photo: file,
      doc: blob,
    };

    const formData = payload(data);
    const photoResult = formData.get('photo');
    const docResult = formData.get('doc');

    expect(photoResult).toBeInstanceOf(File);
    expect(photoResult).toHaveProperty('type', 'image/jpeg');
    expect(photoResult).toHaveProperty('size', file.size);

    expect(docResult).toBeInstanceOf(Blob);
    expect(docResult).toHaveProperty('type', 'application/pdf');
    expect(docResult).toHaveProperty('size', blob.size);
  });

  it('should handle arrays of Blobs', () => {
    const blob1 = new Blob(['file1'], { type: 'text/plain' });
    const blob2 = new Blob(['file2'], { type: 'text/plain' });
    const data = {
      attachments: [blob1, blob2],
    };

    const formData = payload(data);
    const attachments = formData.getAll('attachments');

    expect(attachments).toHaveLength(2);
    expect(attachments[0]).toBeInstanceOf(Blob);
    expect(attachments[0]).toHaveProperty('type', 'text/plain');
    expect(attachments[1]).toBeInstanceOf(Blob);
    expect(attachments[1]).toHaveProperty('type', 'text/plain');
  });

  it('should handle Blobs with no MIME type', () => {
    const blob = new Blob(['content']);
    const data = {
      file: blob,
    };

    const formData = payload(data);
    const result = formData.get('file');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('size', blob.size);
  });

  it('should handle Blobs alongside primitive values', () => {
    const blob = new Blob(['data'], { type: 'application/octet-stream' });
    const data = {
      name: 'test',
      age: 25,
      file: blob,
      active: true,
    };

    const formData = payload(data);
    const fileResult = formData.get('file');

    expect(formData.get('name')).toBe('test');
    expect(formData.get('age')).toBe('25');
    expect(fileResult).toBeInstanceOf(Blob);
    expect(fileResult).toHaveProperty('type', 'application/octet-stream');
    expect(formData.get('active')).toBe('1');
  });

  it('should handle File objects', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const data = {
      upload: file,
    };

    const formData = payload(data);
    const result = formData.get('upload');

    expect(result).toBeInstanceOf(File);
    expect(result).toHaveProperty('type', 'text/plain');
    expect(result).toHaveProperty('size', file.size);
    expect(result).toHaveProperty('name', 'test.txt');
  });

  it('should handle Excel blobs (XLSX)', () => {
    const xlsxBlob = new Blob(['PK...'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const data = {
      spreadsheet: xlsxBlob,
    };

    const formData = payload(data);
    const result = formData.get('spreadsheet');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(result).toHaveProperty('size', xlsxBlob.size);
  });

  it('should handle PowerPoint blobs (PPTX)', () => {
    const pptxBlob = new Blob(['PK...'], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const data = {
      presentation: pptxBlob,
    };

    const formData = payload(data);
    const result = formData.get('presentation');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    expect(result).toHaveProperty('size', pptxBlob.size);
  });

  it('should handle video blobs', () => {
    const videoBlob = new Blob(['fake video'], { type: 'video/mp4' });
    const data = {
      video: videoBlob,
    };

    const formData = payload(data);
    const result = formData.get('video');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'video/mp4');
    expect(result).toHaveProperty('size', videoBlob.size);
  });

  it('should handle audio blobs', () => {
    const audioBlob = new Blob(['fake audio'], { type: 'audio/mpeg' });
    const data = {
      audio: audioBlob,
    };

    const formData = payload(data);
    const result = formData.get('audio');

    expect(result).toBeInstanceOf(Blob);
    expect(result).toHaveProperty('type', 'audio/mpeg');
    expect(result).toHaveProperty('size', audioBlob.size);
  });
});
