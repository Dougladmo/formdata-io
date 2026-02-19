import type { ParsedFile } from '../server/types';

export interface AWSStorageConfig {
  provider: 'aws';
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  keyPrefix?: string;
  acl?: 'public-read' | 'private';
}

export interface SupabaseStorageConfig {
  provider: 'supabase';
  bucket: string;
  url: string;
  serviceKey: string;
  keyPrefix?: string;
}

export type StorageConfig = AWSStorageConfig | SupabaseStorageConfig;

/** Buffer, base64 data URI, or ParsedFile from parser() middleware */
export type UploadInput = ParsedFile | Buffer | string;

export interface UploadOptions {
  /** Required when input is Buffer or base64 string */
  filename?: string;
  /** Override detected MIME type */
  mimetype?: string;
  /** Override key prefix for this upload only */
  keyPrefix?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

export interface ResolvedInput {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
}

export interface StorageAdapter {
  upload(input: UploadInput, options?: UploadOptions): Promise<UploadResult>;
  uploadMany(inputs: UploadInput[], options?: UploadOptions): Promise<UploadResult[]>;
  delete(key: string): Promise<void>;
}
