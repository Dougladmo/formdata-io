import type { AWSStorageConfig, ResolvedInput, UploadResult } from '../types';
import { generateKey } from '../utils';

// Local type interfaces for @aws-sdk/client-s3 (optional peer dependency).
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

let s3ModulePromise: Promise<AwsS3Module> | null = null;

async function loadS3(): Promise<AwsS3Module> {
  if (!s3ModulePromise) {
    const pkg: string = '@aws-sdk/client-s3'; // variable prevents static resolution of optional peer dep
    s3ModulePromise = (import(pkg) as Promise<AwsS3Module>).catch((err) => {
      s3ModulePromise = null;
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

export function createAwsProvider(config: AWSStorageConfig): AwsProvider {
  let clientPromise: Promise<{ client: S3ClientInstance; sdk: AwsS3Module }> | null = null;

  function getClient(): Promise<{ client: S3ClientInstance; sdk: AwsS3Module }> {
    if (!clientPromise) {
      clientPromise = loadS3()
        .then((sdk) => ({ client: buildS3Client(config, sdk.S3Client), sdk }))
        .catch((err) => {
          clientPromise = null;
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
