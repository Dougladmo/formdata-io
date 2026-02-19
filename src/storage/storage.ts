import type {
  StorageConfig,
  StorageAdapter,
  UploadInput,
  UploadOptions,
  UploadResult,
} from './types';
import { resolveInput } from './utils';
import { createAwsProvider } from './providers/aws';
import { supabaseUpload, supabaseDelete } from './providers/supabase';

function validateConfig(config: StorageConfig): void {
  if (!config.provider) {
    throw new Error('Storage config must include a provider ("aws" or "supabase")');
  }

  if (config.provider === 'aws') {
    if (!config.bucket) throw new Error('AWS config requires bucket');
    if (!config.region) throw new Error('AWS config requires region');
    if (!config.accessKeyId) throw new Error('AWS config requires accessKeyId');
    if (!config.secretAccessKey) throw new Error('AWS config requires secretAccessKey');
  } else if (config.provider === 'supabase') {
    if (!config.bucket) throw new Error('Supabase config requires bucket');
    if (!config.url) throw new Error('Supabase config requires url');
    if (!config.serviceKey) throw new Error('Supabase config requires serviceKey');
  } else {
    throw new Error(`Unknown storage provider: "${(config as StorageConfig).provider}"`);
  }
}

/**
 * Create a storage adapter for the specified provider.
 *
 * @example
 * ```typescript
 * const storage = createStorage({
 *   provider: 'aws',
 *   bucket: 'my-bucket',
 *   region: 'us-east-1',
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 * })
 *
 * const result = await storage.upload(req.payload.avatar)
 * ```
 */
export function createStorage(config: StorageConfig): StorageAdapter {
  validateConfig(config);

  if (config.provider === 'aws') {
    // Fix #8: S3Client is created once and reused across all upload/delete calls
    const aws = createAwsProvider(config);

    const upload = async (input: UploadInput, options?: UploadOptions): Promise<UploadResult> => {
      const resolved = resolveInput(input, options);
      return aws.upload(resolved, options?.keyPrefix);
    };

    const uploadMany = async (
      inputs: UploadInput[],
      options?: UploadOptions
    ): Promise<UploadResult[]> => Promise.all(inputs.map((i) => upload(i, options)));

    return { upload, uploadMany, delete: aws.delete };
  }

  // config is narrowed to SupabaseStorageConfig here
  const upload = async (input: UploadInput, options?: UploadOptions): Promise<UploadResult> => {
    const resolved = resolveInput(input, options);
    return supabaseUpload(config, resolved, options?.keyPrefix);
  };

  const uploadMany = async (
    inputs: UploadInput[],
    options?: UploadOptions
  ): Promise<UploadResult[]> => Promise.all(inputs.map((i) => upload(i, options)));

  const del = async (key: string): Promise<void> => supabaseDelete(config, key);

  return { upload, uploadMany, delete: del };
}
