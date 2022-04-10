import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Store extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id', serializeAs: null })
  public userId: number

  @column()
  public reference: string

  @column()
  public type: 'MINECRAFT' | 'MTA' | 'SAMP' | 'FIVEM'

  @column()
  public name: string

  @column()
  public ip: string

  @column()
  public description: string

  @column()
  public address: string

  @column()
  public plan: 'FREE' | 'PRO' | 'PREMIUM'

  @column()
  public status: 'PENDING' | 'SUSPENDED' | 'ACTIVE'

  @column({ columnName: 'expire_in' })
  public expireIn: Date

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
