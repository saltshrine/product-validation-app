import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  // Menampilkan halaman login
  async showLogin({ view }: HttpContext) {
    return view.render('auth/login')
  }

  // Memproses data login
  async login({ request, response, session, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      session.flash('success', 'Berhasil login!')
      return response.redirect().toPath('/products')
    } catch (error) {
      // Cetak error asli ke terminal VS Code untuk debugging
      console.log('DETAIL ERROR LOGIN:', error)

      session.flash('error', `Gagal: ${error.message}`)
      return response.redirect().back()
    }
  }

  // Proses Logout
  async logout({ response, session, auth }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Berhasil logout!')
    return response.redirect().toPath('/login')
  }
}
