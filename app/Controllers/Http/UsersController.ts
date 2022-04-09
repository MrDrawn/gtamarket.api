import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Hash from '@ioc:Adonis/Core/Hash'
import Redis from '@ioc:Adonis/Addons/Redis'

import User from 'App/Models/User'
import UsersVerify from 'App/Models/UsersVerify'

import { ICreateUserBody } from 'App/Interfaces/ICreateUserBody'
import { IVerifyUserParams } from 'App/Interfaces/IVerifyUserParams'
import { IUpdateUserBody } from 'App/Interfaces/IUpdateUserBody'
import { IDeleteUserParams } from 'App/Interfaces/IDeleteUserParams'

import {
  sendMailUserDelete,
  sendMailUserRecovery,
  sendMailUserUpdate,
  sendMailUserVerify,
} from 'Misc/emails/Mail'
import { getRandomInteger } from 'Misc/utils/GenerateRandomNumbers'

import InvalidBodyException from 'App/Exceptions/InvalidBodyException'
import UserAlreadyExistException from 'App/Exceptions/UserAlreadyExistException'
import InternalServerErrorException from 'App/Exceptions/InternalServerErrorException'
import UserTokenInvalidException from 'App/Exceptions/UserTokenInvalidException'

import InvalidParamsException from 'App/Exceptions/InvalidParamsException'
import NoPermissionException from 'App/Exceptions/NoPermissionException'
import UserNotFoundException from 'App/Exceptions/UserNotFoundException'
import UserInvalidPasswordException from 'App/Exceptions/UserInvalidPasswordException'

import { addDays } from 'date-fns'
import { IResetPasswordUserParams } from 'App/Interfaces/IResetPasswordUserParams'
import UsersRecovery from 'App/Models/UsersRecovery'
import { IResetPasswordUserBody } from 'App/Interfaces/IResetPasswordUserBody'
import { IRecoverPasswordUserBody } from 'App/Interfaces/IRecoverPasswordUserBody'

export default class UsersController {
  public all = async ({ auth }: HttpContextContract) => {
    try {
      if (auth.user!.group != 'ADMIN') throw new NoPermissionException('You do not have permission')

      const usersRedis = await Redis.get('users')

      if (usersRedis) {
        const users = JSON.parse(usersRedis)

        return users
      }

      const users = await User.all()

      await Redis.set('users', JSON.stringify(users))

      return users
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public me = async ({ auth }: HttpContextContract) => {
    try {
      const userRedis = await Redis.get(`user:${auth.user!.id}`)

      if (userRedis) {
        const user = JSON.parse(userRedis)

        return user
      }

      const user = await User.find(auth.user!.id)

      await Redis.set(`user:${user?.id}`, JSON.stringify(user))

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

      const users = await User.all()

      await Redis.set('users', JSON.stringify(users))

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
      const { token } = request.params() as IVerifyUserParams

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

        await verify.delete()

        await sendMailUserVerify(user.email, user.name, token)

        throw new UserTokenInvalidException('Token expirado, um novo token foi enviado por e-mail.')
      }

      user.active = true
      await user.save()

      await verify.delete()

      const users = await User.all()

      await Redis.set('users', JSON.stringify(users))

      return response.status(200).json({ status: 200, message: 'E-mail verificado com sucesso.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public recovery = async ({ request, response }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { email } = request.body() as IRecoverPasswordUserBody

      if (!email) throw new InvalidBodyException('E-mail não informado.')

      const user = await User.findBy('email', email)

      if (!user) throw new InvalidBodyException('Usuário não encontrado.')

      const userRecovery = await UsersRecovery.findBy('user_id', user.id)

      if (userRecovery) await userRecovery.delete()

      const token = getRandomInteger(100000, 999999)

      await UsersRecovery.create({
        userId: user.id,
        token,
        expireIn: addDays(new Date(), 1),
      })

      await sendMailUserRecovery(user.email, user.name, token)

      return response
        .status(200)
        .json({ status: 200, message: 'E-mail de recuperação enviado com sucesso.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public reset = async ({ request, response }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { token } = request.params() as IResetPasswordUserParams

      const { password } = request.body() as IResetPasswordUserBody

      if (!token) throw new InvalidParamsException('Invalid token')

      if (!password) throw new InvalidBodyException('Password cannot be empty')

      const recovery = await UsersRecovery.findBy('token', token)

      if (!recovery) throw new UserTokenInvalidException('Token inválido.')

      const user = await User.findBy('id', recovery.userId)

      if (!user) throw new InvalidBodyException('Usuário não encontrado.')

      if (recovery.expireIn < new Date()) {
        await recovery.delete()

        throw new UserTokenInvalidException('Token expirado, solicite uma nova recuperação.')
      }

      user.password = password
      await user.save()

      await recovery.delete()

      const users = await User.all()

      await Redis.set('users', JSON.stringify(users))

      return response.status(200).json({ status: 200, message: 'Senha alterada com sucesso.' })
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

      const users = await User.all()

      await Redis.set('users', JSON.stringify(users))

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

      const users = await User.all()

      await Redis.set('users', JSON.stringify(users))

      await sendMailUserDelete(user.email, user.name)

      return response.status(200).json({ status: 200, message: 'Usuário deletado.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
