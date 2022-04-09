import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Hash from '@ioc:Adonis/Core/Hash'

import User from 'App/Models/User'
import UsersVerify from 'App/Models/UsersVerify'

import { ICreateUserBody } from 'App/Interfaces/ICreateUserBody'
import { IConfirmUserParams } from 'App/Interfaces/IConfirmUserParams'
import { IUpdateUserBody } from 'App/Interfaces/IUpdateUserBody'
import { IDeleteUserParams } from 'App/Interfaces/IDeleteUserParams'

import { sendMailUserDelete, sendMailUserUpdate, sendMailUserVerify } from 'Misc/emails/Mail'
import { getRandomInteger } from 'Misc/utils/GenerateRandomNumbers'

import InvalidBodyException from 'App/Exceptions/InvalidBodyException'
import UserAlreadyExistException from 'App/Exceptions/UserAlreadyExistException'
import InternalServerErrorException from 'App/Exceptions/InternalServerErrorException'
import UserTokenInvalidException from 'App/Exceptions/UserTokenInvalidException'

import InvalidParamsException from 'App/Exceptions/InvalidParamsException'
import NoPermissionException from 'App/Exceptions/NoPermissionException'
import UserNotFoundException from 'App/Exceptions/UserNotFoundException'

import { addDays } from 'date-fns'
import UserInvalidPasswordException from 'App/Exceptions/UserInvalidPasswordException'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class UsersController {
  public me = async ({ auth }: HttpContextContract) => {
    try {
      const userRedis = await Redis.get(`user:${auth.user!.id}`)
      const user = JSON.parse(String(userRedis))

      return user
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

      if (!token) throw new InvalidParamsException('Invalid token')

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

      await verify.delete()

      return response.status(200).json({ status: 200, message: 'E-mail verificado com sucesso.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public update = async ({ request, response, auth }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { name, username, email, password, newPassword } = request.body() as IUpdateUserBody

      if (!name || !username || !email || !password)
        throw new InvalidBodyException('Missing required fields')

      const user = await User.findBy('id', auth.user!.id)

      if (!user) throw new UserNotFoundException('Usuário não encontrado.')

      const passwordMatch = await Hash.verify(user.password, password)

      if (!passwordMatch) throw new UserInvalidPasswordException('Senha atual incorreta.')

      if (
        ((await User.findBy('username', username)) !== null && user.username != username) ||
        ((await User.findBy('email', email)) !== null && user.email != email)
      )
        throw new UserAlreadyExistException('Usuário ou e-mail já cadastrado.')

      user.name = name
      user.username = username
      user.email = email

      if (newPassword) user.password = newPassword

      await user.save()

      await Redis.set(`user:${user.id}`, JSON.stringify(user))

      await sendMailUserUpdate(email, name)

      return response.status(200).json({ status: 200, message: 'Usuário atualizado com sucesso.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public delete = async ({ auth, request, response }: HttpContextContract) => {
    try {
      const { id } = request.params() as IDeleteUserParams

      if (!id) throw new InvalidParamsException('Invalid id')

      if (auth.user!.group != 'ADMIN') throw new NoPermissionException('You do not have permission')

      const user = await User.findBy('id', id)

      if (!user) throw new UserNotFoundException('User not found')

      await user.delete()

      await Redis.del(`user:${user.id}`)

      await sendMailUserDelete(user.email, user.name)

      return response.status(200).json({ status: 200, message: 'Usuário deletado.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
