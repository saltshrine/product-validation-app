import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('check_type').nullable().defaultTo('non-sensitive').after('status_review')
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('check_type')
    })
  }
}