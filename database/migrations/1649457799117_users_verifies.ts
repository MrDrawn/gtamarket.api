import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UsersVerifies extends BaseSchema {
  protected tableName = 'users_verifies'

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
      table.integer('token').unique().notNullable()
      table.dateTime('expire_in').notNullable()

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
