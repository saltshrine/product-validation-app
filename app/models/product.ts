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
  declare statusReview: string

  // --- RELATIONSHIPS ---
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @hasMany(() => ValidationLog)
  declare validationLogs: HasMany<typeof ValidationLog>

  // --- OOP POLYMORPHISM (OVERRIDING) ---
  toSummary(): Record<string, any> {
    const baseSummary = super.toSummary() // Memanggil method parent
    return {
      ...baseSummary,
      title: this.title,
      status: this.statusReview
    }
  }

  // --- HOOKS ---
  /**
   * Hook ini akan otomatis jalan sebelum save/update ke database.
   * Meskipun validasi utama kita taruh di Service & Controller (agar bisa logging), 
   * Hook berguna untuk safety net / normalisasi data.
   */
  @beforeSave()
  static async sanitizeData(product: Product) {
    if (product.$dirty.title) {
      // Pastikan title tidak ada spasi berlebih di awal/akhir
      product.title = product.title.trim()
    }
  }
}