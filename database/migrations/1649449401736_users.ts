import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable()
      table.string('username', 16).unique().notNullable()
      table.string('email').unique().notNullable()
      table.string('password').notNullable()
      table.enum('group', ['CLIENT', 'SUPPORT', 'ADMIN']).defaultTo('CLIENT').notNullable()
      table.boolean('active').defaultTo(false).notNullable()

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
