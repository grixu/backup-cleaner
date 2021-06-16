import { DeleteObjectCommand, ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';
import dotenv from 'dotenv'

dotenv.config({
  path: __dirname + '/.env'
})

const requiredEnvs = ['BUCKET_KEY', 'BUCKET_SECRET', 'BUCKET_ENDPOINT', 'BUCKET_REGION', 'BUCKET_NAME']
requiredEnvs.forEach(item => {
  if (typeof process.env[item] === 'undefined') {
    console.error(`Brak ustawionej zmiennej ${item}`)
    process.exit(1)
  }
})

var s3  = new S3Client({  
  credentials: {
    accessKeyId: process.env.BUCKET_KEY || '',
    secretAccessKey: process.env.BUCKET_SECRET || '',
  },
  endpoint: process.env.BUCKET_ENDPOINT,
  region: process.env.BUCKET_REGION
});

console.log('Rozpoczęcie usuwania starych kopii zapasowych')

const bucket = process.env.BUCKET_NAME
const olderThan :number = parseInt(process.env.OLDER_THAN || '7')
const sevenDaysAgo = dayjs().subtract(olderThan, 'days')

const run = async () => {
  const data = await s3.send(new ListObjectsCommand({
    Bucket: bucket
  }));

  const outdatedFiles = data.Contents?.filter(item => {
    const day = dayjs(item.LastModified)
    return day.isBefore(sevenDaysAgo)
  })

  if (typeof outdatedFiles === 'undefined') {
    console.log('Nie znaleziono żadnych przedawnionych plików')
    return
  }

  console.log(`Znalezionych plików: ${outdatedFiles?.length}`)

  outdatedFiles?.forEach(async (item) => {
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: item.Key
      }))

      console.log(`Usunięto plik: ${item.Key}`)
    } catch (e) {
      console.error(`Wystąpił błędy podczas usuwania ${item.Key}: ${e}`)
    }
  })
}

run()
