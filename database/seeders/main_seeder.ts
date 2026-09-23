import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'
import hash from '@adonisjs/core/services/hash'

export default class extends BaseSeeder {
  async run() {
    // 1. Bersihkan data lama agar fresh
    await Product.query().delete()
    await Category.query().delete()
    await User.query().delete()

    // 2. Buat User Admin
    const admin = await User.create({
      email: 'admin@app.com',
      password: 'password123',
    })

    // 3. Buat Data Kategori
    const catElektronik = await Category.create({ name: 'Elektronik' })
    const catFashion = await Category.create({ name: 'Fashion & Pakaian' })
    const catKuliner = await Category.create({ name: 'Kuliner & Makanan' })

    // 4. Buat Data Produk dengan Berbagai Status (Perlu Di-review & Ditolak)
    await Product.createMany([
      {
        userId: admin.id,
        categoryId: catElektronik.id,
        title: 'Smartphone Android RAM 8GB',
        description: 'Ponsel pintar dengan spesifikasi tinggi untuk gaming dan multitasking.',
        price: 2500000,
        stock: 15,
        scoreSensitive: 85.50,
        scoreNonSensitive: 90.00,
        statusReview: 'approved', // Disetujui
      },
      {
        userId: admin.id,
        categoryId: catFashion.id,
        title: 'Kemeja Flanel Casual Pria',
        description: 'Kemeja bahan katun flanel lembut nyaman dipakai sehari-hari.',
        price: 125000,
        stock: 30,
        scoreSensitive: 40.00,
        scoreNonSensitive: 45.00,
        statusReview: 'pending', // Perlu di-review (Pending)
      },
      {
        userId: admin.id,
        categoryId: catKuliner.id,
        title: 'Keripik Singkong Pedas Daun Jeruk',
        description: 'Camilan renyah gurih dengan bumbu rempah pilihan.',
        price: 15000,
        stock: 100,
        scoreSensitive: 20.00,
        scoreNonSensitive: 30.00,
        statusReview: 'rejected', // Ditolak
      },
    ])

    console.log('Seeder berhasil dijalankan: User, Kategori, dan Produk (Pending & Ditolak) telah ditambahkan!')
  }
}