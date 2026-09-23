import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Lazy loading controllers untuk performa optimal di AdonisJS 6
const ProductsController = () => import('#controllers/products_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const ReportController = () => import('#controllers/reports_controller')
const AuthController = () => import('#controllers/auth_controller')

import SimilarityService from '#services/similarity_service'

// Rute Halaman Utama (Redirect ke /products)
router.get('/', async ({ response }) => {
  return response.redirect().toPath('/login')
}).as('home')

// ==========================================
// RUTE PRODUCTS & REPORT
// ==========================================
router.group(() => {
  router.get('/products', [ProductsController, 'index'])
  router.get('/products/create', [ProductsController, 'create'])
  router.post('/products', [ProductsController, 'store'])
  router.get('/products/:id', [ProductsController, 'show'])
  router.get('/products/:id/edit', [ProductsController, 'edit'])
  router.post('/products/:id/update', [ProductsController, 'update'])
  router.post('/products/:id/delete', [ProductsController, 'destroy'])
}).middleware(middleware.auth())

// ==========================================
// RUTE API (AJAX LIVE TRACKING)
// ==========================================
router.post('/api/check-similarity', async ({ request }) => {
  const { title, description, checkType } = request.only(['title', 'description', 'checkType'])
  
  const service = new SimilarityService()
  const isSensitive = checkType === 'sensitive'
  const result = service.hitungSkorKemiripan(title || '', description || '', isSensitive)

  return {
    percentage: result.percentage,
    matchCount: result.matchCount,
    totalChars: result.totalChars,
  }
})

// ==========================================
// RUTE CATEGORIES
// ==========================================
router.get('/categories', [CategoriesController, 'index'])
router.get('/categories/create', [CategoriesController, 'create'])
router.post('/categories', [CategoriesController, 'store'])

// ==========================================
// RUTE AUTHENTICATION
// ==========================================
router.get('/register', async () => {
  return 'Halaman Register (UI belum dibuat)'
}).as('new_account.create')

router.post('/register', async () => {
  return 'Proses Register'
}).as('new_account.store')

router.get('/login', [AuthController, 'showLogin']).as('session.create')
router.post('/login', [AuthController, 'login']).as('session.store')
router.post('/logout', [AuthController, 'logout']).as('session.destroy')