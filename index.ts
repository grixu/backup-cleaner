import { DeleteObjectCommand, ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';
import dotenv from 'dotenv'
import { IncomingWebhook } from '@slack/webhook'

dotenv.config({
  path: __dirname + '/.env'
})

const requiredEnvs = ['BUCKET_KEY', 'BUCKET_SECRET', 'BUCKET_ENDPOINT', 'BUCKET_REGION', 'BUCKET_NAME', 'WEBHOOK']
requiredEnvs.forEach(item => {
  if (typeof process.env[item] === 'undefined') {
    console.error(`Brak ustawionej zmiennej ${item}`)
    process.exit(1)
  }
})

const slack = new IncomingWebhook(process.env.WEBHOOK || '')

var s3  = new S3Client({  
  credentials: {
    accessKeyId: process.env.BUCKET_KEY || '',
    secretAccessKey: process.env.BUCKET_SECRET || '',
  },
  endpoint: process.env.BUCKET_ENDPOINT,
  region: process.env.BUCKET_REGION
});

const logger = async (msg: string, isError: boolean = false): Promise<void> => {
  if (isError) {
    await slack.send({
      icon_emoji: ':red_circle:',
      text: msg
    })
    console.error(msg)

    return
  }
  
  await slack.send({
    text: msg
  })
  console.log(msg)
}

const bucket = process.env.BUCKET_NAME
const olderThan :number = parseInt(process.env.OLDER_THAN || '7')
const sevenDaysAgo = dayjs().subtract(olderThan, 'days')

const run = async () => {
  await logger(`Rozpoczęcie usuwania starych kopii zapasowych z bucketu: ${bucket}`)

  const data = await s3.send(new ListObjectsCommand({
    Bucket: bucket
  }));

  const outdatedFiles = data.Contents?.filter(item => {
    const day = dayjs(item.LastModified)
    return day.isBefore(sevenDaysAgo)
  })

  if (typeof outdatedFiles === 'undefined') {
    await logger('Nie znaleziono żadnych przedawnionych plików')
    return
  }

  console.log(`Znalezionych plików: ${outdatedFiles?.length}`)

  outdatedFiles?.forEach(async (item) => {
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: item.Key
      }))

      await logger(`Usunięto plik: ${item.Key}`)
    } catch (e) {
      await logger(`Wystąpił błędy podczas usuwania ${item.Key}: ${e}`, true)
    }
  })
}

run()
