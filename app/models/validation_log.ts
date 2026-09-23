import { column } from '@adonisjs/lucid/orm'
import AppBaseModel from './app_base_model.js'

export default class ValidationLog extends AppBaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare scoreSensitive: number

  @column()
  declare scoreNonSensitive: number

  @column()
  declare thresholdUsed: number

  @column()
  declare resultStatus: string // aman, perlu_review, ditolak
}