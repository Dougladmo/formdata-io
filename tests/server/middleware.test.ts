import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { parser } from '../../src/server';

describe('parser() middleware - Basic Functionality', () => {
  it('should skip non-multipart requests', async () => {
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

  it('should skip requests without content-type header', async () => {
    const req = {
      headers: {},
    } as Request;

    const res = {} as Response;
    const next = vi.fn();

    const middleware = parser();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.payload).toBeUndefined();
  });

  it('should create middleware function with default options', () => {
    const middleware = parser();

    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3); // (req, res, next)
  });

  it('should create middleware function with custom options', () => {
    const middleware = parser({
      maxFileSize: 1024 * 1024,
      maxFiles: 5,
    });

    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3);
  });

  it('should be asynchronous middleware', async () => {
    const req = {
      headers: { 'content-type': 'application/json' },
    } as Request;

    const res = {} as Response;
    const next = vi.fn();

    const middleware = parser();
    const result = middleware(req, res, next);

    // Should return a promise
    expect(result).toBeInstanceOf(Promise);

    await result;
  });
});

describe('parser() - Type Exports', () => {
  it('should export parser function', () => {
    expect(parser).toBeDefined();
    expect(typeof parser).toBe('function');
  });
});
