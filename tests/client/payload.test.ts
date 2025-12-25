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
