import dotenv from 'dotenv'

dotenv.config({
  path: __dirname + '/../.env'
})

export default function() {
  const requiredEnvs = ['BUCKET_KEY', 'BUCKET_SECRET', 'BUCKET_ENDPOINT', 'BUCKET_REGION', 'BUCKET_NAME', 'WEBHOOK']
  requiredEnvs.forEach(item => {
    if (typeof process.env[item] === 'undefined') {
      console.error(`Brak ustawionej zmiennej ${item}`)
      throw new Error('Env missing')
    }
  })
}
