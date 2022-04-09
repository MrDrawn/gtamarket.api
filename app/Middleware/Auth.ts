import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import UserNotVerifiedException from 'App/Exceptions/UserNotVerifiedException'
import AuthErrorException from 'App/Exceptions/AuthErrorException'

export default class Auth {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>) {
    try {
      await auth.use('api').authenticate()

      if (!auth.user?.active) throw new UserNotVerifiedException('Usuário não verificado.')

      await next()
    } catch (error) {
      throw new AuthErrorException(error.message)
    }
  }
}
