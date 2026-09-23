import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import { categoryValidator } from '#validators/category_validator'

export default class CategoriesController {
  async index({ view }: HttpContext) {
    const categories = await Category.all()
    return view.render('categories/index', { categories })
  }

  async create({ view }: HttpContext) {
    return view.render('categories/create')
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(categoryValidator)
    const isSensitive = !!request.input('isSensitive')

    await Category.create({ ...payload, isSensitive })

    session.flash('success', 'Kategori berhasil dibuat!')
    return response.redirect().toPath('/categories')
  }
}