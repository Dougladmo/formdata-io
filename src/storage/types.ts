import type { ParsedFile } from '../server/types';

export interface AWSStorageConfig {
  provider: 'aws';
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /**
   * Session token for temporary credentials (STS, IAM roles on EC2/Lambda/ECS/EKS).
   * Required when using short-lived credentials from AWS STS or instance profiles.
   */
  sessionToken?: string;
  endpoint?: string;
  keyPrefix?: string;
  /**
   * S3 Object ACL. Note: since April 2023 new buckets have Object Ownership set to
   * "Bucket owner enforced" by default, which disables ACLs entirely. Setting this
   * option on such buckets will throw an `AccessControlListNotSupported` error.
   */
  acl?: 'public-read' | 'private';
}

export interface SupabaseStorageConfig {
  provider: 'supabase';
  bucket: string;
  url: string;
  serviceKey: string;
  keyPrefix?: string;
  /**
   * Whether the bucket is public. Defaults to `true`.
   *
   * When `true`, `UploadResult.url` is the full public URL
   * (`/storage/v1/object/public/{bucket}/{key}`).
   *
   * When `false`, `UploadResult.url` contains only the storage key.
   * Callers are responsible for generating a signed URL via the Supabase client
   * or REST API before serving the file to end users.
   *
   * @default true
   */
  publicBucket?: boolean;
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
