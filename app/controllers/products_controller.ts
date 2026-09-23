import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'
import ValidationLog from '#models/validation_log'
import SimilarityService from '#services/similarity_service'
import { productValidator } from '#validators/product_validator'
import ReportController from '#controllers/reports_controller'
import db from '@adonisjs/lucid/services/db'

export default class ProductsController {
  protected similarityService: SimilarityService

  constructor() {
    this.similarityService = new SimilarityService()
  }

  async index({ view }: HttpContext) {
    const products = await Product.query().preload('category').orderBy('id', 'desc')
    const report = await ReportController.getSummaryReport()

    return view.render('products/index', { products, report })
  }

  async create({ view }: HttpContext) {
    const categories = await Category.all()
    return view.render('products/create', { categories })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const payload = await request.validateUsing(productValidator)

    await Category.findOrFail(payload.categoryId)

    const validationResult = this.similarityService.validasiProduk(
      payload.title,
      payload.description,
      payload.checkType
    )

    const trx = await db.transaction()

    try {
      const product = new Product()
      product.userId = auth.user!.id
      product.categoryId = payload.categoryId
      product.title = payload.title
      product.description = payload.description
      product.price = payload.price
      product.stock = payload.stock
      product.checkType = payload.checkType
      product.scoreSensitive = validationResult.scoreSensitive
      product.scoreNonSensitive = validationResult.scoreNonSensitive
      product.statusReview = validationResult.status
      product.useTransaction(trx)
      await product.save()

      await ValidationLog.create(
        {
          productId: product.id,
          scoreSensitive: validationResult.scoreSensitive,
          scoreNonSensitive: validationResult.scoreNonSensitive,
          thresholdUsed: validationResult.threshold,
          resultStatus: validationResult.status,
        },
        { client: trx }
      )

      await trx.commit()

      session.flash('success', `Produk tersimpan! Status Validasi: ${validationResult.status.toUpperCase()}`)
      return response.redirect().toPath('/products')
    } catch (error) {
      await trx.rollback()
      session.flash('error', 'Gagal menyimpan produk. Silakan coba lagi.')
      return response.redirect().back()
    }
  }

  async show({ params, view }: HttpContext) {
    const product = await Product.query()
      .where('id', params.id)
      .preload('category')
      .preload('validationLogs')
      .firstOrFail()

    return view.render('products/show', { product })
  }

  async edit({ params, view }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const categories = await Category.all()
    return view.render('products/edit', { product, categories })
  }

  async update({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(productValidator)

    await Category.findOrFail(payload.categoryId)

    const validationResult = this.similarityService.validasiProduk(
      payload.title,
      payload.description,
      payload.checkType
    )

    const trx = await db.transaction()

    try {
      const product = await Product.findOrFail(params.id, { client: trx })

      product.categoryId = payload.categoryId
      product.title = payload.title
      product.description = payload.description
      product.price = payload.price
      product.stock = payload.stock
      product.checkType = payload.checkType
      product.scoreSensitive = validationResult.scoreSensitive
      product.scoreNonSensitive = validationResult.scoreNonSensitive
      product.statusReview = validationResult.status
      await product.save()

      await ValidationLog.create(
        {
          productId: product.id,
          scoreSensitive: validationResult.scoreSensitive,
          scoreNonSensitive: validationResult.scoreNonSensitive,
          thresholdUsed: validationResult.threshold,
          resultStatus: validationResult.status,
        },
        { client: trx }
      )

      await trx.commit()

      session.flash('success', 'Produk berhasil di-update dan divalidasi ulang!')
      return response.redirect().toPath('/products')
    } catch (error) {
      await trx.rollback()
      session.flash('error', 'Gagal mengupdate produk. Silakan coba lagi.')
      return response.redirect().back()
    }
  }

  async destroy({ params, response, session }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.delete()

    session.flash('success', 'Produk berhasil dihapus!')
    return response.redirect().toPath('/products')
  }
}
