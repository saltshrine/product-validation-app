import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      
      // Foreign Keys
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('CASCADE')
      
      // Free Inputs
      table.string('title').notNullable()
      table.text('description').notNullable()
      
      table.integer('price').notNullable()
      table.integer('stock').notNullable()
      
      // Validation Results
      table.decimal('score_sensitive', 5, 2).nullable() // misal 100.00
      table.decimal('score_non_sensitive', 5, 2).nullable()
      table.string('status_review').defaultTo('perlu_review') // aman, perlu_review, ditolak
      
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}