import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'validation_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE')
      
      table.decimal('score_sensitive', 5, 2).notNullable()
      table.decimal('score_non_sensitive', 5, 2).notNullable()
      table.decimal('threshold_used', 5, 2).notNullable()
      table.string('result_status').notNullable()
      
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}