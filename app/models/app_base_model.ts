import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AppBaseModel extends BaseModel {
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  toSummary(): Record<string, any> {
    return {
      id: this.$getAttribute('id'),
      created: this.createdAt?.toFormat('yyyy-MM-dd HH:mm:ss'),
    }
  }
}
