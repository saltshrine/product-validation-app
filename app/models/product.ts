import { column, belongsTo, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import AppBaseModel from './app_base_model.js'
import Category from './category.js'
import User from './user.js'
import ValidationLog from './validation_log.js'

export default class Product extends AppBaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare categoryId: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare price: number

  @column()
  declare stock: number

  @column()
  declare scoreSensitive: number

  @column()
  declare scoreNonSensitive: number

  @column()
  declare checkType: 'sensitive' | 'non-sensitive' | null

  @column()
  declare statusReview: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @hasMany(() => ValidationLog)
  declare validationLogs: HasMany<typeof ValidationLog>

  toSummary(): Record<string, any> {
    const baseSummary = super.toSummary()
    return {
      ...baseSummary,
      title: this.title,
      status: this.statusReview,
    }
  }

  @beforeSave()
  static async sanitizeData(product: Product) {
    if (product.$dirty.title) {
      product.title = product.title.trim()
    }
  }
}