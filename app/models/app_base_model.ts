import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

// Abstract class agar tidak bisa di-instantiate langsung
export default class AppBaseModel extends BaseModel {
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Helper method bersama (Contoh penerapan OOP).
   * Bisa di-override oleh child class.
   */
  toSummary(): Record<string, any> {
    return {
      id: this.$getAttribute('id'),
      created: this.createdAt?.toFormat('yyyy-MM-dd HH:mm:ss'),
    }
  }
}
