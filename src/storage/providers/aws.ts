import type { AWSStorageConfig, ResolvedInput, UploadResult } from '../types';
import { generateKey } from '../utils';

// Minimal local interfaces for @aws-sdk/client-s3 (optional peer dependency).
// Defined here so the build does not require the SDK to be installed — consumers
// who want AWS support install it separately per the peerDependencies declaration.

interface S3CredentialsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

interface S3ClientConfig {
  region: string;
  credentials: S3CredentialsConfig;
  endpoint?: string;
  forcePathStyle?: boolean;
}

interface S3Command {
  readonly _tag: 'S3Command';
}

interface S3ClientInstance {
  send(command: S3Command): Promise<void>;
}

interface PutObjectCommandInput {
  Bucket: string;
  Key: string;
  Body: Buffer;
  ContentType: string;
  ContentLength: number;
  ACL?: string;
}

interface DeleteObjectCommandInput {
  Bucket: string;
  Key: string;
}

interface AwsS3Module {
  S3Client: new (config: S3ClientConfig) => S3ClientInstance;
  PutObjectCommand: new (input: PutObjectCommandInput) => S3Command;
  DeleteObjectCommand: new (input: DeleteObjectCommandInput) => S3Command;
}

// Module-level SDK cache — Node.js also caches dynamic imports internally, but
// caching the Promise here avoids re-running the try/catch wrapper on each call.
let s3ModulePromise: Promise<AwsS3Module> | null = null;

async function loadS3(): Promise<AwsS3Module> {
  if (!s3ModulePromise) {
    // A runtime string variable prevents TypeScript from statically resolving
    // this optional peer dependency at build time.
    const pkg: string = '@aws-sdk/client-s3';
    s3ModulePromise = (import(pkg) as Promise<AwsS3Module>).catch((err) => {
      s3ModulePromise = null; // allow retry if caller installs the SDK later
      void err;
      throw new Error(
        'AWS S3 SDK not found. Install it with: npm install @aws-sdk/client-s3'
      );
    });
  }
  return s3ModulePromise;
}

function buildS3Client(
  config: AWSStorageConfig,
  S3Client: new (config: S3ClientConfig) => S3ClientInstance
): S3ClientInstance {
  const credentials: S3CredentialsConfig = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  };

  // Fix #4: pass sessionToken for temporary credentials (STS / IAM roles)
  if (config.sessionToken) {
    credentials.sessionToken = config.sessionToken;
  }

  const baseConfig: S3ClientConfig = {
    region: config.region,
    credentials,
  };

  if (config.endpoint) {
    return new S3Client({ ...baseConfig, endpoint: config.endpoint, forcePathStyle: true });
  }

  return new S3Client(baseConfig);
}

export interface AwsProvider {
  upload(resolved: ResolvedInput, keyPrefix?: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}

/**
 * Create a provider instance that caches the S3Client across upload/delete calls.
 *
 * Fix #8: a single S3Client is created lazily and reused for all operations on
 * this adapter instance instead of constructing a new client per request.
 */
export function createAwsProvider(config: AWSStorageConfig): AwsProvider {
  // Per-instance client cache. Lazily initialised on first use.
  let clientPromise: Promise<{ client: S3ClientInstance; sdk: AwsS3Module }> | null = null;

  function getClient(): Promise<{ client: S3ClientInstance; sdk: AwsS3Module }> {
    if (!clientPromise) {
      clientPromise = loadS3()
        .then((sdk) => ({ client: buildS3Client(config, sdk.S3Client), sdk }))
        .catch((err) => {
          clientPromise = null; // allow retry
          throw err;
        });
    }
    return clientPromise;
  }

  async function upload(resolved: ResolvedInput, keyPrefix?: string): Promise<UploadResult> {
    const { client, sdk } = await getClient();

    const prefix = keyPrefix ?? config.keyPrefix;
    const key = generateKey(resolved.filename, prefix);

    const putParams: PutObjectCommandInput = {
      Bucket: config.bucket,
      Key: key,
      Body: resolved.buffer,
      ContentType: resolved.mimetype,
      ContentLength: resolved.size,
    };

    if (config.acl) {
      putParams.ACL = config.acl;
    }

    try {
      await client.send(new sdk.PutObjectCommand(putParams));
    } catch (err: unknown) {
      // Fix #7: surface a clear message for the common ACL misconfiguration
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('AccessControlListNotSupported')) {
        throw new Error(
          `S3 ACL error on bucket "${config.bucket}": ACLs are disabled because the bucket uses ` +
            `Object Ownership = "Bucket owner enforced" (the default since April 2023). ` +
            `Remove the 'acl' option from your AWS config or change the bucket's Object Ownership ` +
            `setting in the S3 console. Original error: ${msg}`
        );
      }
      throw err;
    }

    const url = config.endpoint
      ? `${config.endpoint.replace(/\/$/, '')}/${config.bucket}/${key}`
      : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

    return {
      url,
      key,
      size: resolved.size,
      mimetype: resolved.mimetype,
    };
  }

  async function del(key: string): Promise<void> {
    const { client, sdk } = await getClient();

    await client.send(
      new sdk.DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
  }

  return { upload, delete: del };
}
