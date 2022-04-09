import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UsersStores extends BaseSchema {
  protected tableName = 'users_stores'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
        .notNullable()
      table.string('reference').unique().notNullable()
      table.enum('type', ['MINECRAFT', 'MTA', 'SAMP', 'FIVEM']).notNullable()
      table.string('name').notNullable()
      table.string('ip').notNullable()
      table.string('description').notNullable()
      table.string('address').unique().notNullable()
      table.enum('plan', ['FREE', 'PRO', 'PREMIUM']).notNullable()
      table.enum('status', ['PENDING', 'SUSPENDED', 'ACTIVE']).notNullable()
      table.dateTime('expire_in').notNullable()
      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
