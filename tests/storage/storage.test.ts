import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorage } from '../../src/storage';
import type { ParsedFile } from '../../src/server/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../src/storage/providers/aws', () => ({
  createAwsProvider: vi.fn(),
}));

vi.mock('../../src/storage/providers/supabase', () => ({
  supabaseUpload: vi.fn(),
  supabaseDelete: vi.fn(),
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomUUID: () => 'test-uuid-1234',
  };
});

import { createAwsProvider } from '../../src/storage/providers/aws';
import { supabaseUpload, supabaseDelete } from '../../src/storage/providers/supabase';

const mockCreateAwsProvider = vi.mocked(createAwsProvider);
const mockSupabaseUpload = vi.mocked(supabaseUpload);
const mockSupabaseDelete = vi.mocked(supabaseDelete);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const awsConfig = {
  provider: 'aws' as const,
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};

const supabaseConfig = {
  provider: 'supabase' as const,
  bucket: 'avatars',
  url: 'https://project.supabase.co',
  serviceKey: 'service-key-123',
};

const parsedFile: ParsedFile = {
  fieldname: 'avatar',
  originalname: 'photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('fake-image-data'),
};

const mockUploadResult = {
  url: 'https://my-bucket.s3.us-east-1.amazonaws.com/test-uuid-1234-photo.jpg',
  key: 'test-uuid-1234-photo.jpg',
  size: 1024,
  mimetype: 'image/jpeg',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createStorage', () => {
  let mockProviderUpload: ReturnType<typeof vi.fn>;
  let mockProviderDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProviderUpload = vi.fn().mockResolvedValue(mockUploadResult);
    mockProviderDelete = vi.fn().mockResolvedValue(undefined);

    mockCreateAwsProvider.mockReturnValue({
      upload: mockProviderUpload,
      delete: mockProviderDelete,
    });

    mockSupabaseUpload.mockResolvedValue({
      ...mockUploadResult,
      url: 'https://project.supabase.co/storage/v1/object/public/avatars/test-uuid-1234-photo.jpg',
    });
    mockSupabaseDelete.mockResolvedValue(undefined);
  });

  describe('config validation', () => {
    it('throws when provider is missing', () => {
      expect(() => createStorage({} as never)).toThrow(
        'Storage config must include a provider'
      );
    });

    it('throws for unknown provider', () => {
      expect(() => createStorage({ provider: 'gcs' } as never)).toThrow(
        'Unknown storage provider'
      );
    });

    it('throws when AWS bucket is missing', () => {
      expect(() =>
        createStorage({ ...awsConfig, bucket: '' })
      ).toThrow('AWS config requires bucket');
    });

    it('throws when AWS region is missing', () => {
      expect(() =>
        createStorage({ ...awsConfig, region: '' })
      ).toThrow('AWS config requires region');
    });

    it('throws when AWS accessKeyId is missing', () => {
      expect(() =>
        createStorage({ ...awsConfig, accessKeyId: '' })
      ).toThrow('AWS config requires accessKeyId');
    });

    it('throws when AWS secretAccessKey is missing', () => {
      expect(() =>
        createStorage({ ...awsConfig, secretAccessKey: '' })
      ).toThrow('AWS config requires secretAccessKey');
    });

    it('throws when Supabase bucket is missing', () => {
      expect(() =>
        createStorage({ ...supabaseConfig, bucket: '' })
      ).toThrow('Supabase config requires bucket');
    });

    it('throws when Supabase url is missing', () => {
      expect(() =>
        createStorage({ ...supabaseConfig, url: '' })
      ).toThrow('Supabase config requires url');
    });

    it('throws when Supabase serviceKey is missing', () => {
      expect(() =>
        createStorage({ ...supabaseConfig, serviceKey: '' })
      ).toThrow('Supabase config requires serviceKey');
    });
  });

  describe('upload(ParsedFile)', () => {
    it('creates AWS provider with config and calls upload with resolved input', async () => {
      const storage = createStorage(awsConfig);
      const result = await storage.upload(parsedFile);

      expect(mockCreateAwsProvider).toHaveBeenCalledWith(awsConfig);
      expect(mockProviderUpload).toHaveBeenCalledOnce();
      const [resolvedInput, keyPrefix] = mockProviderUpload.mock.calls[0];
      expect(resolvedInput.buffer).toEqual(parsedFile.buffer);
      expect(resolvedInput.filename).toBe('photo.jpg');
      expect(resolvedInput.mimetype).toBe('image/jpeg');
      expect(resolvedInput.size).toBe(1024);
      expect(keyPrefix).toBeUndefined();
      expect(result).toEqual(mockUploadResult);
    });

    it('calls supabaseUpload with resolved input for Supabase provider', async () => {
      const storage = createStorage(supabaseConfig);
      await storage.upload(parsedFile);

      expect(mockSupabaseUpload).toHaveBeenCalledOnce();
      const [, resolvedInput] = mockSupabaseUpload.mock.calls[0];
      expect(resolvedInput.filename).toBe('photo.jpg');
      expect(resolvedInput.mimetype).toBe('image/jpeg');
    });

    it('passes per-upload keyPrefix override', async () => {
      const storage = createStorage(awsConfig);
      await storage.upload(parsedFile, { keyPrefix: 'overridden/' });

      const [, keyPrefix] = mockProviderUpload.mock.calls[0];
      expect(keyPrefix).toBe('overridden/');
    });
  });

  describe('upload(base64 string)', () => {
    const base64Image =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

    it('converts base64 to buffer and uploads via AWS', async () => {
      const storage = createStorage(awsConfig);
      await storage.upload(base64Image, { filename: 'image.png' });

      expect(mockProviderUpload).toHaveBeenCalledOnce();
      const [resolvedInput] = mockProviderUpload.mock.calls[0];
      expect(Buffer.isBuffer(resolvedInput.buffer)).toBe(true);
      expect(resolvedInput.filename).toBe('image.png');
      expect(resolvedInput.mimetype).toBe('image/png');
    });

    it('throws when filename is missing for base64 upload', async () => {
      const storage = createStorage(awsConfig);
      await expect(storage.upload(base64Image)).rejects.toThrow(
        'filename is required in options when uploading a base64 string'
      );
    });
  });

  describe('upload(Buffer)', () => {
    const buf = Buffer.from('pdf-content');

    it('uploads buffer with explicit filename and mimetype', async () => {
      const storage = createStorage(awsConfig);
      await storage.upload(buf, { filename: 'doc.pdf', mimetype: 'application/pdf' });

      expect(mockProviderUpload).toHaveBeenCalledOnce();
      const [resolvedInput] = mockProviderUpload.mock.calls[0];
      expect(resolvedInput.buffer).toBe(buf);
      expect(resolvedInput.filename).toBe('doc.pdf');
      expect(resolvedInput.mimetype).toBe('application/pdf');
    });

    it('defaults mimetype to application/octet-stream when not specified', async () => {
      const storage = createStorage(awsConfig);
      await storage.upload(buf, { filename: 'data.bin' });

      const [resolvedInput] = mockProviderUpload.mock.calls[0];
      expect(resolvedInput.mimetype).toBe('application/octet-stream');
    });

    it('throws when filename is missing for Buffer upload', async () => {
      const storage = createStorage(awsConfig);
      await expect(storage.upload(buf)).rejects.toThrow(
        'filename is required in options when uploading a Buffer'
      );
    });
  });

  describe('uploadMany', () => {
    it('uploads multiple files and returns array of results', async () => {
      const storage = createStorage(awsConfig);
      const file2: ParsedFile = { ...parsedFile, originalname: 'photo2.jpg' };
      const results = await storage.uploadMany([parsedFile, file2]);

      expect(mockProviderUpload).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it('uploads in parallel', async () => {
      let resolveFirst!: () => void;
      let resolveSecond!: () => void;
      const order: number[] = [];

      mockProviderUpload
        .mockImplementationOnce(
          () =>
            new Promise((res) => {
              resolveFirst = () => {
                order.push(1);
                res(mockUploadResult);
              };
            })
        )
        .mockImplementationOnce(
          () =>
            new Promise((res) => {
              resolveSecond = () => {
                order.push(2);
                res(mockUploadResult);
              };
            })
        );

      const storage = createStorage(awsConfig);
      const file2: ParsedFile = { ...parsedFile, originalname: 'photo2.jpg' };
      const promise = storage.uploadMany([parsedFile, file2]);

      // Both promises are started — resolve second first to prove parallelism
      resolveSecond();
      resolveFirst();

      await promise;
      expect(order).toEqual([2, 1]);
    });
  });

  describe('delete', () => {
    it('calls provider delete with the correct key for AWS', async () => {
      const storage = createStorage(awsConfig);
      await storage.delete('avatars/test-uuid-photo.jpg');

      expect(mockProviderDelete).toHaveBeenCalledWith('avatars/test-uuid-photo.jpg');
    });

    it('calls supabaseDelete with the correct key for Supabase', async () => {
      const storage = createStorage(supabaseConfig);
      await storage.delete('users/test-uuid-photo.jpg');

      expect(mockSupabaseDelete).toHaveBeenCalledWith(
        supabaseConfig,
        'users/test-uuid-photo.jpg'
      );
    });
  });
});

describe('generateKey (via resolveInput integration)', () => {
  let mockProviderUpload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProviderUpload = vi.fn().mockResolvedValue({
      url: '',
      key: '',
      size: 0,
      mimetype: '',
    });
    vi.mocked(createAwsProvider).mockReturnValue({
      upload: mockProviderUpload,
      delete: vi.fn(),
    });
  });

  it('config keyPrefix is captured in the provider closure (no per-call keyPrefix)', async () => {
    const configWithPrefix = { ...awsConfig, keyPrefix: 'avatars/' };
    const storage = createStorage(configWithPrefix);

    expect(vi.mocked(createAwsProvider)).toHaveBeenCalledWith(configWithPrefix);

    await storage.upload(parsedFile);

    // per-call keyPrefix arg is undefined; the config prefix is handled inside the provider
    const [, keyPrefix] = mockProviderUpload.mock.calls[0];
    expect(keyPrefix).toBeUndefined();
  });
});
