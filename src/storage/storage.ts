import type {
  StorageConfig,
  StorageAdapter,
  UploadInput,
  UploadOptions,
  UploadResult,
} from './types';
import { resolveInput } from './utils';
import { awsUpload, awsDelete } from './providers/aws';
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

  async function upload(input: UploadInput, options?: UploadOptions): Promise<UploadResult> {
    const resolved = resolveInput(input, options);
    const keyPrefix = options?.keyPrefix;

    if (config.provider === 'aws') {
      return awsUpload(config, resolved, keyPrefix);
    }

    return supabaseUpload(config, resolved, keyPrefix);
  }

  async function uploadMany(
    inputs: UploadInput[],
    options?: UploadOptions
  ): Promise<UploadResult[]> {
    return Promise.all(inputs.map((input) => upload(input, options)));
  }

  async function del(key: string): Promise<void> {
    if (config.provider === 'aws') {
      return awsDelete(config, key);
    }

    return supabaseDelete(config, key);
  }

  return { upload, uploadMany, delete: del };
}
