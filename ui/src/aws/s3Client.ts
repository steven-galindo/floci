import { S3Client } from '@aws-sdk/client-s3'
import { FLOCI_ENDPOINT } from '../config'

export function createS3Client() {
  return new S3Client({
    endpoint: FLOCI_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  })
}

export const s3Client = createS3Client()
