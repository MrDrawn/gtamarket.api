import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Redis from '@ioc:Adonis/Addons/Redis'

import User from 'App/Models/User'

import { ILoginUserBody } from 'App/Interfaces/ILoginUserBody'

import InternalServerErrorException from 'App/Exceptions/InternalServerErrorException'
import InvalidBodyException from 'App/Exceptions/InvalidBodyException'
import UserNotFoundException from 'App/Exceptions/UserNotFoundException'
import UserNotVerifiedException from 'App/Exceptions/UserNotVerifiedException'
import UserLoginFailedException from 'App/Exceptions/UserLoginFailedException'

export default class AuthController {
  public login = async ({ request, response, auth }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { email, password, remember } = request.body() as ILoginUserBody

      if (!email || !password) throw new InvalidBodyException('Missing required fields')

      const user = await User.findBy('email', email)

      if (!user) throw new UserNotFoundException('Usuário não encontrado.')

      if (!user.active) throw new UserNotVerifiedException('Usuário não verificado.')

      try {
        const { token } = await auth.use('api').attempt(email, password, {
          expiresIn: remember ? '6h' : '3h',
        })

        await Redis.set(`user:${user.id}`, JSON.stringify(user))

        return response
          .status(200)
          .json({ status: 200, message: 'Login realizado com sucesso.', token })
      } catch {
        throw new UserLoginFailedException('Usuário ou senha inválidos.')
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
