import { IncomingWebhook } from '@slack/webhook'

const slack = new IncomingWebhook(process.env.WEBHOOK || '')

export default async (msg: string, isError: boolean = false): Promise<void> => {
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