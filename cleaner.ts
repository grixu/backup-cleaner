import { DeleteObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';
import { s3 } from './commons/makeClient';
import logger from './commons/logger'

const bucket = process.env.BUCKET_NAME
const olderThan :number = parseInt(process.env.OLDER_THAN || '7')
const sevenDaysAgo = dayjs().subtract(olderThan, 'days')

export default async () => {
  await logger(`Rozpoczęcie usuwania starych kopii zapasowych z bucketu: ${bucket}`)

  let data; 

  try {
    data = await s3.send(new ListObjectsCommand({
      Bucket: bucket
    }));
  } catch (e) {
    await logger('Błąd pobierania danych', true)
  }

  const outdatedFiles = data?.Contents?.filter(item => {
    const day = dayjs(item.LastModified)
    return day.isBefore(sevenDaysAgo)
  })

  if (typeof outdatedFiles === 'undefined') {
    await logger('Nie znaleziono żadnych przedawnionych plików')
    return
  }

  await logger(`Znalezionych plików: ${outdatedFiles?.length}`)

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
