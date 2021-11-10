import checkEnv from './checkEnv';
import { S3Client } from '@aws-sdk/client-s3';

checkEnv()

export const s3 = new S3Client({  
  credentials: {
    accessKeyId: process.env.S3_KEY || '',
    secretAccessKey: process.env.S3_SECRET || '',
  },
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION
});