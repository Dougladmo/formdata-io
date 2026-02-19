import type { AWSStorageConfig, ResolvedInput, UploadResult } from '../types';
import { generateKey } from '../utils';

async function loadS3(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S3Client: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PutObjectCommand: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DeleteObjectCommand: any;
}> {
  try {
    return await import('@aws-sdk/client-s3' as string) as never;
  } catch {
    throw new Error(
      'AWS S3 SDK not found. Install it with: npm install @aws-sdk/client-s3'
    );
  }
}

export async function awsUpload(
  config: AWSStorageConfig,
  resolved: ResolvedInput,
  keyPrefix?: string
): Promise<UploadResult> {
  const { S3Client, PutObjectCommand } = await loadS3();

  const prefix = keyPrefix ?? config.keyPrefix;
  const key = generateKey(resolved.filename, prefix);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientConfig: Record<string, any> = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };

  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const putParams: Record<string, any> = {
    Bucket: config.bucket,
    Key: key,
    Body: resolved.buffer,
    ContentType: resolved.mimetype,
    ContentLength: resolved.size,
  };

  if (config.acl) {
    putParams.ACL = config.acl;
  }

  await client.send(new PutObjectCommand(putParams));

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

export async function awsDelete(config: AWSStorageConfig, key: string): Promise<void> {
  const { S3Client, DeleteObjectCommand } = await loadS3();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientConfig: Record<string, any> = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };

  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig);

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}
