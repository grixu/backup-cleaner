import dotenv from 'dotenv'

dotenv.config({
  path: __dirname + '/../.env'
})

export default function() {
  const requiredEnvs = ['S3_KEY', 'S3_SECRET', 'S3_ENDPOINT', 'S3_REGION', 'BUCKET_NAME', 'SLACK_WEBHOOK']
  requiredEnvs.forEach(item => {
    if (typeof process.env[item] === 'undefined') {
      console.error(`Brak ustawionej zmiennej ${item}`)
      throw new Error('Env missing')
    }
  })
}
