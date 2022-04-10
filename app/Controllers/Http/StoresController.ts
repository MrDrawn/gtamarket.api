import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Redis from '@ioc:Adonis/Addons/Redis'

import Store from 'App/Models/Store'

import { IStoreReferenceParams } from 'App/Interfaces/IStoreReferenceParams'
import { ICreateStoreBody } from 'App/Interfaces/ICreateStoreBody'
import { IUpdateStoreBody } from 'App/Interfaces/IUpdateStoreBody'
import { IDeleteStoreParams } from 'App/Interfaces/IDeleteStoreParams'

import { sendMailStoreDelete } from 'Misc/emails/Mail'

import NoPermissionException from 'App/Exceptions/NoPermissionException'
import InvalidParamsException from 'App/Exceptions/InvalidParamsException'
import StoreNotFoundException from 'App/Exceptions/StoreNotFoundException'
import InvalidBodyException from 'App/Exceptions/InvalidBodyException'
import UserNotFoundException from 'App/Exceptions/UserNotFoundException'
import StoreAlreadyExistException from 'App/Exceptions/StoreAlreadyExistException'
import InternalServerErrorException from 'App/Exceptions/InternalServerErrorException'

import { v4 as uuid } from 'uuid'

export default class StoresController {
  public all = async ({ auth }: HttpContextContract) => {
    try {
      if (auth.user!.group != 'ADMIN') throw new NoPermissionException('You do not have permission')

      const storesRedis = await Redis.get('stores')

      if (storesRedis) {
        const stores = JSON.parse(storesRedis)

        return stores
      }

      const stores = await Store.all()

      await Redis.set('stores', JSON.stringify(stores))

      return stores
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public store = async ({ auth, request }: HttpContextContract) => {
    try {
      const { reference } = request.params() as IStoreReferenceParams

      if (!reference) throw new InvalidParamsException('Invalid reference')

      const storeRedis = await Redis.get(`store:${reference}`)

      if (storeRedis) {
        const store = JSON.parse(storeRedis)

        if (store.user_id != auth.user!.id)
          throw new NoPermissionException('You do not have permission')

        return store
      }

      const store = await Store.findBy('reference', reference)

      if (!store) throw new StoreNotFoundException('Store not found')

      if (store.userId != auth.user!.id)
        throw new NoPermissionException('You do not have permission')

      await Redis.set(`store:${reference}`, JSON.stringify(store))

      return store
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public create = async ({ request, response, auth }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { type, name, ip, description, address, plan } = request.body() as ICreateStoreBody

      if (!type || !name || !ip || !description || !address || !plan)
        throw new InvalidBodyException('Missing required fields')

      const storesRedis = await Redis.get('stores')
      const stores = JSON.parse(storesRedis ? storesRedis : '[]')

      stores.map((store) => {
        if (store.address == address) throw new StoreAlreadyExistException('Store already exists')
      })

      const reference = uuid()

      const store = await Store.create({
        userId: auth.user!.id,
        reference,
        type,
        name,
        ip,
        description,
        address,
        plan,
        status: 'PENDING',
        expireIn: new Date(),
      })

      stores.push(store)

      await Redis.set(`store:${reference}`, JSON.stringify(store))
      await Redis.set('stores', JSON.stringify(stores))

      return response.status(201).json({ status: 201, message: 'Loja criada.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public update = async ({ request, response, auth }: HttpContextContract) => {
    try {
      if (!request.hasBody()) throw new InvalidBodyException('Body cannot be empty')

      const { reference } = request.params() as IStoreReferenceParams

      if (!reference) throw new InvalidParamsException('Invalid reference')

      const { type, name, ip, description, address } = request.body() as IUpdateStoreBody

      if (!type || !name || !ip || !description || !address)
        throw new InvalidBodyException('Missing required fields')

      const store = await Store.findBy('reference', reference)

      if (!store) throw new StoreNotFoundException('Store not found')

      if (store.userId != auth.user!.id)
        throw new NoPermissionException('You do not have permission')

      store.merge({
        type,
        name,
        ip,
        description,
        address,
      })

      await store.save()

      await Redis.set(`store:${reference}`, JSON.stringify(store))

      const stores = await Store.all()

      await Redis.set('stores', JSON.stringify(stores))

      return response.status(200).json({ status: 200, message: 'Loja atualizada.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  public delete = async ({ auth, request, response }: HttpContextContract) => {
    try {
      const { id } = request.params() as IDeleteStoreParams

      if (!id) throw new InvalidParamsException('Invalid id')

      const user: any = await Redis.get(`user:${auth.user!.id}`)

      if (!user) throw new UserNotFoundException('User not found')

      const store = await Store.findBy('id', id)

      if (!store) throw new StoreNotFoundException('Store not found')

      if (store.userId != auth.user!.id)
        throw new NoPermissionException('You do not have permission')

      await store.delete()

      await Redis.del(`store:${store.reference}`)

      const stores = await Store.all()

      await Redis.set('stores', JSON.stringify(stores))

      await sendMailStoreDelete(user.email, user.name, store.address)

      return response.status(200).json({ status: 200, message: 'Loja deletada.' })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
