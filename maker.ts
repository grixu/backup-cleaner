import { s3 } from './commons/makeClient'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import logger from './commons/logger'
import { exec } from 'child_process'
import { readFileSync, existsSync, createReadStream } from 'fs'
import dayjs from 'dayjs';
import { BackupItem } from './types'

export default async function() {
  const backupFileName = __dirname + '/backups.json'

  if (!existsSync(backupFileName)) {
    await logger('Plik z konfiguracją backupów nie istnieje', true)
    throw new Error('Backup configuration file does not exist!')
  }
  const backupsFile = readFileSync(backupFileName).toString()

  if (backupsFile.length <= 0) {
    await logger('Plik z konfiguracją backupów jest pusty', true)
    throw new Error('Backup configuration file is empty')
  }

  const backupsJson = JSON.parse(backupsFile)

  function isValidBackupItem(item: unknown): item is BackupItem {
    for (const k of ['cmd', 'name', 'file', 'path']) {
      // @ts-ignore
      if (!(k in item)) {
        return false
      }
    }

    return true
  }

  backupsJson.backups.forEach((element: unknown) => {
    if (!isValidBackupItem(element)) {
      return
    }

    const result = exec(element.cmd, {
      cwd: element.path,
    }, async (err, stdout) => {
      if (err) {
        await logger('Błąd podczas wykonywania backupu ' + element.name)
      }

      if (stdout) {
        console.log(stdout)
      }

      const localFileName = element.path + '/' + element.file
      const test = existsSync(localFileName)
      if(test) {
        const s3FileName = dayjs().format('YYYY-MM-DD') + '-' + element.file
        const fileStream = createReadStream(localFileName)

        try {
          await s3.send(new PutObjectCommand({
            Body: fileStream,
            Bucket: process.env.BUCKET_NAME,
            Key: s3FileName
          }))
          await logger('Pomyślnie utworzono i wgrano backup ' + element.name)
        } catch (e) {
          if (e instanceof Error) {
            await logger('Błąd podczas wgrywania pliku backupu ' + element.name +' do backetu. Szczegóły błędu ' + e.toString(), true)
          } else {
            await logger('Wystąpił nieznany błąd podczas wykonywania backupu ' + element.name, true)
          }
        }
      } else {
        await logger('Polecenie backupu ' + element.name + ' niezwróciło wskazanego w konfiguracji pliku.')
      }
    })
  })
}