import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'

export default class ReportController {
  public static async getSummaryReport() {
    const allProducts = await Product.all()
    let totalAman = 0
    let totalReview = 0
    let totalDitolak = 0
    let totalScoreSum = 0

    for (let i = 0; i < allProducts.length; i++) {
      const prod = allProducts[i]

      if (prod.statusReview === 'approved') {
        totalAman++
      } else if (prod.statusReview === 'pending') {
        totalReview++
      } else if (prod.statusReview === 'rejected') {
        totalDitolak++
      }

      totalScoreSum += Number(prod.scoreNonSensitive) || 0
    }

    const avgScore = allProducts.length > 0 ? Math.round((totalScoreSum / allProducts.length) * 100) / 100 : 0
    const successRate = allProducts.length > 0 ? Math.round((totalAman / allProducts.length) * 100) : 0

    return {
      totalProducts: allProducts.length,
      totalAman,
      totalReview,
      totalDitolak,
      avgScore,
      successRate,
    }
  }
}