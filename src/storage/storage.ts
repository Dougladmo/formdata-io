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

export function createStorage(config: StorageConfig): StorageAdapter {
  validateConfig(config);

  if (config.provider === 'aws') {
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
