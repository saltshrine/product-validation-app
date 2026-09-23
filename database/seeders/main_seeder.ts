import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'
import ValidationLog from '#models/validation_log'
import SimilarityService from '#services/similarity_service'

export default class extends BaseSeeder {
  async run() {
    const similarityService = new SimilarityService()

    await ValidationLog.query().delete()
    await Product.query().delete()
    await Category.query().delete()
    await User.query().delete()

    const admin = await User.create({
      email: 'admin@app.com',
      password: 'password123',
    })

    const electronics = await Category.create({ name: 'Elektronik', isSensitive: true })
    const fashion = await Category.create({ name: 'Fashion & Pakaian', isSensitive: false })
    const food = await Category.create({ name: 'Kuliner & Makanan', isSensitive: false })

    const products = [
      {
        categoryId: electronics.id,
        title: 'ABCD',
        description: 'ABCD',
        price: 2500000,
        stock: 15,
        checkType: 'sensitive' as const,
      },
      {
        categoryId: fashion.id,
        title: 'ABBCD',
        description: 'Gallant Duck',
        price: 125000,
        stock: 30,
        checkType: 'non-sensitive' as const,
      },
      {
        categoryId: food.id,
        title: 'ABCD',
        description: 'A___',
        price: 15000,
        stock: 100,
        checkType: 'sensitive' as const,
      },
      {
        categoryId: food.id,
        title: 'ABBCD',
        description: 'Gallant Duck',
        price: 20000,
        stock: 80,
        checkType: 'sensitive' as const,
      },
      {
        categoryId: fashion.id,
        title: 'AAAAA',
        description: 'A____',
        price: 90000,
        stock: 25,
        checkType: 'sensitive' as const,
      },
    ]

    for (const productData of products) {
      const validationResult = similarityService.validasiProduk(
        productData.title,
        productData.description,
        productData.checkType
      )

      const product = await Product.create({
        userId: admin.id,
        categoryId: productData.categoryId,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        checkType: productData.checkType,
        scoreSensitive: validationResult.scoreSensitive,
        scoreNonSensitive: validationResult.scoreNonSensitive,
        statusReview: validationResult.status,
      })

      await ValidationLog.create({
        productId: product.id,
        scoreSensitive: validationResult.scoreSensitive,
        scoreNonSensitive: validationResult.scoreNonSensitive,
        thresholdUsed: validationResult.threshold,
        resultStatus: validationResult.status,
      })
    }

    console.log('Seeder berhasil: 1 user, 3 kategori, 5 produk, dan 5 validation log dibuat.')
  }
}