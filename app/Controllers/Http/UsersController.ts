import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

import UsersVerify from 'App/Models/UsersVerify'

import { ICreateUserBody } from 'App/Interfaces/ICreateUserBody'
import { IConfirmUserParams } from 'App/Interfaces/IConfirmUserParams'

import { sendMailUserVerify } from 'Misc/emails/Mail'

import { getRandomInteger } from 'Misc/utils/GenerateRandomNumbers'

import { addDays } from 'date-fns'

import InvalidBodyException from 'App/Exceptions/InvalidBodyException'
import UserAlreadyExistException from 'App/Exceptions/UserAlreadyExistException'
import InternalServerErrorException from 'App/Exceptions/InternalServerErrorException'
import UserTokenInvalidException from 'App/Exceptions/UserTokenInvalidException'

export default class UsersController {
  public me = async ({ auth }: HttpContextContract) => {
    try {
      return auth.user
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public create = async ({ request, response }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { name, username, email, password } = request.body() as ICreateUserBody

      if (!name || !username || !email || !password)
        throw new InvalidBodyException('Missing required fields')

      if (
        (await User.findBy('username', username)) !== null ||
        (await User.findBy('email', email)) !== null
      )
        throw new UserAlreadyExistException('Usuário ou e-mail já cadastrado.')

      const user = await User.create({
        name,
        username,
        email,
        password,
      })

      const token = getRandomInteger(100000, 999999)

      await UsersVerify.create({
        userId: user.id,
        token,
        expireIn: addDays(new Date(), 1),
      })

      await sendMailUserVerify(email, name, token)

      return response.status(201).json({ status: 201, message: 'Usuário criado com sucesso.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public verify = async ({ request, response }: HttpContextContract) => {
    try {
      const { token } = request.params() as IConfirmUserParams

      if (!token) throw new InvalidBodyException('Missing required fields')

      const verify = await UsersVerify.findBy('token', token)

      if (!verify) throw new UserTokenInvalidException('Token inválido.')

      const user = await User.findBy('id', verify.userId)

      if (!user) throw new InvalidBodyException('Usuário não encontrado.')

      if (verify.expireIn < new Date()) {
        const token = getRandomInteger(100000, 999999)

        await UsersVerify.create({
          userId: user.id,
          token,
          expireIn: addDays(new Date(), 1),
        })

        verify.delete()
        await verify.save()

        await sendMailUserVerify(user.email, user.name, token)

        throw new UserTokenInvalidException('Token expirado, um novo token foi enviado por e-mail.')
      }

      user.active = true
      await user.save()

      verify.delete()
      await verify.save()

      return response.status(200).json({ status: 200, message: 'E-mail verificado com sucesso.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}