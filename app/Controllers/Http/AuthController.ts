import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { ILoginUserBody } from 'App/Interfaces/ILoginUserBody'

import InternalServerErrorException from 'App/Exceptions/InternalServerErrorException'
import InvalidBodyException from 'App/Exceptions/InvalidBodyException'
import User from 'App/Models/User'
import UserNotFoundException from 'App/Exceptions/UserNotFoundException'
import UserNotVerifiedException from 'App/Exceptions/UserNotVerifiedException'

export default class AuthController {
  public login = async ({ request, response, auth }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { email, password } = request.body() as ILoginUserBody

      if (!email || !password) throw new InvalidBodyException('Missing required fields')

      const user = await User.findBy('email', email)

      if (!user) throw new UserNotFoundException('Usuário não encontrado.')

      if (!user.active) throw new UserNotVerifiedException('Usuário não verificado.')

      try {
        const token = await auth.use('api').attempt(email, password)

        return response
          .status(200)
          .json({ status: 200, message: 'Login realizado com sucesso.', token })
      } catch {
        return response.status(401).json({ status: 401, message: 'Usuário ou senha inválidos.' })
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
