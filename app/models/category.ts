import { column } from '@adonisjs/lucid/orm'
import AppBaseModel from './app_base_model.js'

// Meng-extends AppBaseModel
export default class Category extends AppBaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare isSensitive: boolean
}