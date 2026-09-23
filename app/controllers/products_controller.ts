import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'
import ValidationLog from '#models/validation_log'
import SimilarityService from '#services/similarity_service'
import { productValidator } from '#validators/product_validator'
import ReportController from '#controllers/reports_controller'

export default class ProductsController {
  // Inject service ke dalam controller
  protected similarityService: SimilarityService

  constructor() {
    this.similarityService = new SimilarityService()
  }

  // Method Index dengan integrasi ReportController
  async index({ view }: HttpContext) {
    // 1. Menarik data product beserta relasi kategorinya
    const products = await Product.query().preload('category').orderBy('id', 'desc')
    
    // 2. Ambil data ringkasan laporan dari ReportController
    const report = await ReportController.getSummaryReport()

    // 3. Kirim variabel products DAN report ke view
    return view.render('products/index', { products, report })
  }

  async create({ view }: HttpContext) {
    const categories = await Category.all()
    return view.render('products/create', { categories })
  }

  async store({ request, response, session }: HttpContext) {
    // 1. Validasi input menggunakan VineJS
    const payload = await request.validateUsing(productValidator)

    // 2. Ambil data kategori untuk mengecek apakah ini kategori sensitif
    await Category.findOrFail(payload.categoryId)

    // 3. PANGGIL SERVICE (Proses Algoritma)
    const validationResult = this.similarityService.validasiProduk(
      payload.title,
      payload.description,
      payload.checkType
    )

    // 4. Simpan ke database (Model Product)
    const product = new Product()
    product.userId = 1 // TODO: Ganti dengan auth.user!.id jika sistem login sudah diaktifkan
    product.categoryId = payload.categoryId
    product.title = payload.title
    product.description = payload.description
    product.price = payload.price
    product.stock = payload.stock
    
    // Hasil dari perhitungan
    product.scoreSensitive = validationResult.scoreSensitive
    product.scoreNonSensitive = validationResult.scoreNonSensitive
    product.statusReview = validationResult.status

    await product.save()

    // 5. Simpan Histori ke ValidationLog (Wajib Log Setiap Percobaan)
    await ValidationLog.create({
      productId: product.id,
      scoreSensitive: validationResult.scoreSensitive,
      scoreNonSensitive: validationResult.scoreNonSensitive,
      thresholdUsed: validationResult.threshold,
      resultStatus: validationResult.status
    })

    // 6. Redirect dengan Flash Message
    session.flash('success', `Produk tersimpan! Status Validasi: ${validationResult.status.toUpperCase()}`)
    return response.redirect().toPath('/products')
  }

  async show({ params, view }: HttpContext) {
    // Tarik data product lengkap dengan relasinya
    const product = await Product.query()
      .where('id', params.id)
      .preload('category')
      .preload('validationLogs') // Membaca history validasi
      .firstOrFail()
      
    return view.render('products/show', { product })
  }

  async edit({ params, view }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const categories = await Category.all()
    return view.render('products/edit', { product, categories })
  }

  // Memproses update data & re-run validasi algoritma
  async update({ params, request, response, session }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const payload = await request.validateUsing(productValidator)

    // Cek kategori untuk threshold
    await Category.findOrFail(payload.categoryId)

    // JALANKAN ULANG ALGORITMA KEMIRIPAN (Re-run validasi)
    const validationResult = this.similarityService.validasiProduk(
      payload.title,
      payload.description,
      payload.checkType
    )

    // Update data produk
    product.categoryId = payload.categoryId
    product.title = payload.title
    product.description = payload.description
    product.price = payload.price
    product.stock = payload.stock
    product.scoreSensitive = validationResult.scoreSensitive
    product.scoreNonSensitive = validationResult.scoreNonSensitive
    product.statusReview = validationResult.status

    await product.save()

    // Catat log baru untuk perubahan ini
    await ValidationLog.create({
      productId: product.id,
      scoreSensitive: validationResult.scoreSensitive,
      scoreNonSensitive: validationResult.scoreNonSensitive,
      thresholdUsed: validationResult.threshold,
      resultStatus: validationResult.status
    })

    session.flash('success', 'Produk berhasil di-update dan divalidasi ulang!')
    return response.redirect().toPath('/products')
  }

  async destroy({ params, response, session }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.delete()
    
    session.flash('success', 'Produk berhasil dihapus!')
    return response.redirect().toPath('/products')
  }
}