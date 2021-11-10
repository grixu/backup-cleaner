import checkEnv from './checkEnv';
import { S3Client } from '@aws-sdk/client-s3';

checkEnv()

export const s3 = new S3Client({  
  credentials: {
    accessKeyId: process.env.BUCKET_KEY || '',
    secretAccessKey: process.env.BUCKET_SECRET || '',
  },
  endpoint: process.env.BUCKET_ENDPOINT,
  region: process.env.BUCKET_REGION
});