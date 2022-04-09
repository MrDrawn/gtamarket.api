import Mail, { MessageContract } from '@ioc:Adonis/Addons/Mail'

import Env from '@ioc:Adonis/Core/Env'

import { addDays, format } from 'date-fns'

export async function sendMailUserVerify(email: string, name: string, token: number) {
  return await Mail.sendLater((message: MessageContract) => {
    message
      .from(Env.get('SMTP_USERNAME'), 'GTAMarket')
      .to(email)
      .subject('Faça a verificação de seu e-mail')
      .htmlView('emails/users/verify', {
        name,
        token,
        expireIn: format(addDays(new Date(), 1), 'dd/MM/yyyy'),
      })
      .encoding('utf-8')
  })
}
