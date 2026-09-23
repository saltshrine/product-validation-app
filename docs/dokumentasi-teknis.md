# Dokumentasi Teknis Product Validation App

## Gambaran Umum

Product Validation App adalah web app berbasis **AdonisJS**, **TypeScript**, **Lucid ORM**, dan **PostgreSQL**. Aplikasi menerima data produk berupa `title`, `description`, kategori, harga, stok, serta tipe pemeriksaan. Sistem menghitung kemiripan karakter antara title dan description, menentukan status validasi, menyimpan produk, dan mencatat histori setiap percobaan validasi.

Status bisnis yang digunakan oleh implementasi saat ini adalah:

- `approved`: skor minimal 60%.
- `pending`: skor minimal threshold 25%, tetapi belum mencapai 60%.
- `rejected`: skor di bawah 25%.

> **Catatan akurasi:** Requirement menyebut `Set<string>` dan Strategy Pattern, tetapi kode aktual saat ini menggunakan `boolean[]` untuk menandai karakter yang sudah dipakai dan belum memiliki folder `strategies/` atau interface `MatchStrategy`. Dokumentasi ini menjelaskan implementasi aktual, lalu membedakan rancangan improvement yang diharapkan.

---

# 1. Analisa Masalah & Solusi

## 1.1 Problem Statement

Masalah bisnis yang diselesaikan adalah kebutuhan untuk memvalidasi apakah judul dan deskripsi produk memiliki kemiripan yang cukup. Tujuannya adalah membantu mendeteksi informasi produk yang berpotensi menyesatkan pembeli, tidak konsisten, atau terlalu berbeda antara title dan description.

Aplikasi menghasilkan dua skor:

1. `scoreSensitive`: perbandingan case-sensitive.
2. `scoreNonSensitive`: perbandingan case-insensitive.

Salah satu skor dipilih sebagai `finalScore` berdasarkan `checkType` yang dikirim pengguna. Hasilnya disimpan sebagai status `approved`, `pending`, atau `rejected`.

## 1.2 Breakdown Requirement

| Sub-masalah | Implementasi |
|---|---|
| Input handling | Form menerima title, description, category, price, stock, dan check type. `productValidator` memvalidasi tipe dan batas minimal input menggunakan VineJS. |
| Similarity scoring | `SimilarityService.hitungSkorKemiripan` membandingkan karakter input pertama dengan karakter input kedua memakai nested loop. |
| Case sensitivity | Mode `sensitive` membandingkan karakter dengan `===`; mode `non-sensitive` membandingkan hasil `toLowerCase()`. |
| Duplicate prevention | Array boolean `isMatched` mencegah satu posisi karakter pada input kedua dihitung lebih dari satu kali. |
| Threshold decision | `validasiProduk` memilih skor sesuai tipe pemeriksaan lalu menerapkan threshold 25% dan batas approved 60%. |
| Persistence | `Product` menyimpan data produk dan skor terbaru menggunakan Lucid Active Record. |
| Logging | `ValidationLog` menyimpan skor, threshold, status, dan waktu setiap validasi. |
| CRUD | `ProductsController` menyediakan create, read/index/show, update, dan delete. |
| Reporting | `ReportController.getSummaryReport` menghitung jumlah approved, pending, rejected, rata-rata skor, dan success rate. |

## 1.3 Asumsi & Batasan

- Threshold global saat ini adalah konstanta `25`, bukan threshold berbeda per kategori.
- Batas `approved` adalah `60%`.
- Kategori memiliki field `isSensitive`, tetapi field tersebut belum digunakan untuk menentukan threshold atau mode matching secara otomatis.
- Karakter pada input kedua hanya boleh dipakai satu kali. Ini mencegah duplicate count pada karakter yang sama.
- Spasi di awal dan akhir kedua input dihapus menggunakan `trim()`.
- Panjang pembagi menggunakan panjang input pertama setelah `trim()`, bukan panjang maksimum kedua string atau jumlah karakter unik.
- Case-sensitive dan case-insensitive dihitung setiap kali `validasiProduk` dipanggil.
- Input divalidasi minimal: title 3 karakter, description 5 karakter, category ID positif, price dan stock minimal 0.
- `ProductsController.store` masih memakai `product.userId = 1`; relasi ke user login belum memakai `auth.user!.id`.
- Setiap create dan update menulis satu record histori ke `validation_logs`.
- Bila kedua input kosong, skor dikembalikan sebagai `0` dan tidak terjadi pembagian dengan nol.

## 1.4 Alur Data End-to-End

```text
User mengisi form produk
        |
        v
POST /products atau POST /products/:id/update
        |
        v
ProductsController
  - request.validateUsing(productValidator)
  - mengambil kategori
  - memanggil SimilarityService.validasiProduk
        |
        v
SimilarityService
  - hitung skor sensitive
  - hitung skor non-sensitive
  - memilih finalScore berdasarkan checkType
  - menentukan approved/pending/rejected
        |
        v
Product Lucid Model
  - menyimpan title, description, harga, stok, skor, status
        |
        +--> PostgreSQL: products
        |
        +--> ValidationLog.create(...)
                |
                v
        PostgreSQL: validation_logs
        |
        v
Redirect ke /products
        |
        v
ProductsController.index
  - mengambil products + category
  - menghitung summary report
        |
        v
resources/views/products/index.edge
```

Alur detail produk hampir sama, tetapi controller melakukan preload terhadap `category` dan `validationLogs`, kemudian mengirim keduanya ke `products/show.edge`.

---

# 2. Algoritma & Struktur Data

## 2.1 Struktur Data Aktual

Requirement menyebut `Set<string>`, tetapi implementasi aktual tidak menggunakan `Set`. Kode menggunakan array karakter dan array boolean paralel:

```typescript
const chars2 = trimmed2.split('')
const isMatched = new Array(chars2.length).fill(false)
```

`chars2[j]` menyimpan karakter pada posisi `j` di input kedua. `isMatched[j]` bernilai `true` jika posisi tersebut sudah digunakan sebagai pasangan.

Contoh:

```text
input2       = G a l l a n t _ D u c k
index        = 0 1 2 3 4 5 6 7 8 9 10 11
isMatched    = F F F F F F F F F F F  F
```

Setelah karakter pada index 8 digunakan:

```text
isMatched    = F F F F F F F F T F F F
```

### Trade-off terhadap Set

**Array boolean yang dipakai saat ini:**

- Sederhana dan cocok karena algoritma memang membutuhkan status berdasarkan posisi karakter `j`.
- Lookup `isMatched[j]` adalah `O(1)`.
- Membutuhkan ruang `O(m)`.
- Tetap perlu melakukan scan terhadap seluruh `chars2`, sehingga tidak menghilangkan nested loop.

**Set<string>` sesuai rancangan requirement:**

- Lookup karakter yang sudah dipakai dapat dilakukan secara rata-rata `O(1)`.
- Lebih cocok untuk melacak nilai karakter jika posisi tidak penting.
- Tidak cukup untuk kasus duplicate character jika hanya menyimpan string, karena `A` pertama dan `A` kedua akan dianggap nilai yang sama. Untuk algoritma ini, posisi atau jumlah frekuensi karakter penting.
- Karena itu, `Set<number>` untuk index atau `Map<string, number>` untuk frekuensi bisa lebih tepat daripada `Set<string>`.

Kesimpulannya, `boolean[]` saat ini merupakan representasi status posisi yang valid, tetapi bukan implementasi `Set<string>` seperti yang disebutkan di requirement.

## 2.2 Algoritma Nested Loop

Potongan kode asli dari `app/services/similarity_service.ts`:

```typescript
let matchCount = 0
const chars2 = trimmed2.split('')
const isMatched = new Array(chars2.length).fill(false)

for (let i = 0; i < trimmed1.length; i++) {
  const char1 = trimmed1[i]

  for (let j = 0; j < chars2.length; j++) {
    const char2 = chars2[j]

    if (!isMatched[j]) {
      if (isSensitive) {
        if (char1 === char2) {
          matchCount++
          isMatched[j] = true
          break
        }
      } else {
        if (char1.toLowerCase() === char2.toLowerCase()) {
          matchCount++
          isMatched[j] = true
          break
        }
      }
    }
  }
}
```

Langkah algoritma:

1. Trim input pertama dan kedua.
2. Buat `chars2` dari input kedua.
3. Buat `isMatched` dengan panjang yang sama seperti input kedua.
4. Loop luar berjalan untuk setiap karakter input pertama.
5. Loop dalam mencari karakter yang cocok di input kedua.
6. Posisi yang sudah dipakai dilewati.
7. Untuk mode sensitive, karakter dibandingkan apa adanya.
8. Untuk mode non-sensitive, kedua karakter diubah ke lowercase sebelum dibandingkan.
9. Jika cocok, `matchCount` bertambah satu, posisi ditandai, lalu loop dalam berhenti dengan `break`.

## 2.3 Kompleksitas Waktu & Ruang

Misalkan:

- `n` = panjang input pertama.
- `m` = panjang input kedua.

Kompleksitas waktu worst-case adalah:

```text
O(n x m)
```

Alasannya, setiap karakter input pertama dapat memeriksa seluruh karakter input kedua sebelum menemukan pasangan atau menyimpulkan tidak ada pasangan.

Kompleksitas ruang adalah:

```text
O(m)
```

karena kode menyimpan `chars2` dan `isMatched` sepanjang input kedua.

Implementasi saat ini **bukan O(n + m)**. Walaupun akses `isMatched[j]` adalah `O(1)`, pencarian kandidat masih dilakukan dengan nested loop. Penggunaan `Set` tidak otomatis mengubah algoritma menjadi `O(n + m)` jika algoritma masih perlu mencocokkan karakter satu per satu dengan aturan duplicate dan posisi.

Untuk input title dan description yang relatif pendek, `O(n x m)` masih merupakan trade-off yang wajar dan mudah diaudit.

## 2.4 Nested If

Percabangan utama terjadi dalam tiga lapisan:

```typescript
if (!isMatched[j]) {
  if (isSensitive) {
    if (char1 === char2) {
      // match sensitive
    }
  } else {
    if (char1.toLowerCase() === char2.toLowerCase()) {
      // match non-sensitive
    }
  }
}
```

Urutannya penting:

1. **Duplicate check:** posisi yang sudah digunakan tidak boleh dihitung ulang.
2. **Mode check:** sistem menentukan apakah perbandingan harus case-sensitive.
3. **Character match:** hanya pasangan yang benar-benar cocok yang menambah skor.

Pada tahap keputusan bisnis, nested if yang berbeda digunakan:

```typescript
if (finalScore >= 60) {
  status = 'approved'
} else {
  if (finalScore >= threshold) {
    status = 'pending'
  } else {
    status = 'rejected'
  }
}
```

Artinya, nilai tertinggi diuji lebih dahulu. Jika tidak mencapai 60%, barulah sistem membedakan pending dan rejected berdasarkan threshold 25%.

## 2.5 Mathematics

Rumus yang digunakan:

```text
percentage = (matchCount / totalChars) x 100
totalChars = length(trim(input1))
```

Pembulatan dilakukan sampai dua angka desimal:

```typescript
let percentage = (matchCount / totalChars) * 100
percentage = Math.round(percentage * 100) / 100
```

Edge case input kosong ditangani sebelum pembagian:

```typescript
if (totalChars === 0) {
  return { matchCount: 0, totalChars: 0, percentage: 0 }
}
```

Dengan demikian, `0 / 0` tidak pernah terjadi.

Pada `validasiProduk`, dua skor dihitung dan salah satunya dipilih:

```typescript
const sensitiveResult = this.hitungSkorKemiripan(title, description, true)
const nonSensitiveResult = this.hitungSkorKemiripan(title, description, false)

const finalScore = checkType === 'sensitive'
  ? sensitiveResult.percentage
  : nonSensitiveResult.percentage
```

Keputusan status:

```text
finalScore >= 60              -> approved
25 <= finalScore < 60         -> pending
finalScore < 25               -> rejected
```

## 2.6 Trace Manual: `ABBCD` vs `Gallant Duck`

Setelah `trim()`:

```text
input1 = ABBCD        panjang 5
input2 = Gallant Duck  panjang 12
```

Index input kedua:

```text
0:G  1:a  2:l  3:l  4:a  5:n  6:t  7:' '  8:D  9:u  10:c  11:k
```

### Mode sensitive

Perbandingan case-sensitive membedakan `A` dengan `a`.

| Iterasi loop luar | Karakter input1 | Hasil pencarian | Index input2 yang dipakai |
|---:|---|---|---:|
| 1 | `A` | Tidak cocok; input2 memiliki `a` lowercase, bukan `A` | - |
| 2 | `B` | Tidak ditemukan | - |
| 3 | `B` | Tidak ditemukan | - |
| 4 | `C` | Cocok dengan `c`? Tidak, karena sensitive; `C` uppercase berbeda dari `c` lowercase | - |
| 5 | `D` | Cocok dengan `D` | 8 |

Hasil sensitive berdasarkan karakter persis:

```text
matchCount = 1
totalChars = 5
percentage = (1 / 5) x 100 = 20.00%
```

Statusnya `rejected` karena berada di bawah 25%.

### Mode non-sensitive

Perbandingan case-insensitive mengubah karakter ke lowercase.

| Iterasi loop luar | Karakter input1 | Hasil pencarian | Index input2 yang dipakai |
|---:|---|---|---:|
| 1 | `A` | Cocok dengan `a` setelah lowercase | 1 |
| 2 | `B` | Tidak ditemukan | - |
| 3 | `B` | Tidak ditemukan | - |
| 4 | `C` | Cocok dengan `c` setelah lowercase | 10 |
| 5 | `D` | Cocok dengan `D` | 8 |

Hasil non-sensitive:

```text
matchCount = 3
totalChars = 5
percentage = (3 / 5) x 100 = 60.00%
```

Statusnya `approved`, karena tepat mencapai batas 60%.

> Catatan: karakter `B` muncul dua kali pada input pertama, tetapi tidak ditemukan pada input kedua. Jika karakter duplikat tersedia di input kedua, setiap posisi hanya bisa dipakai sekali karena `isMatched[j]`.

---

# 3. Prinsip OOP

## 3.1 Encapsulation

`ProductsController` tidak menghitung karakter secara langsung. Controller hanya memanggil method publik service:

```typescript
const validationResult = this.similarityService.validasiProduk(
  payload.title,
  payload.description,
  payload.checkType
)
```

Detail algoritma berada di dalam `SimilarityService`:

```typescript
export default class SimilarityService {
  public hitungSkorKemiripan(...) {
    // detail nested loop dan perhitungan disembunyikan di sini
  }

  public validasiProduk(...) {
    // detail pemilihan skor dan threshold disembunyikan di sini
  }
}
```

Ini adalah encapsulation pada level service: controller mengetahui kontrak pemanggilan, tetapi tidak perlu mengetahui array `chars2`, `isMatched`, nested loop, atau rumus persentase.

Model juga mengenkapsulasi akses data melalui Lucid ORM. Controller menggunakan `Product.query()`, `Product.create()`, `product.save()`, dan `product.delete()` tanpa menulis SQL langsung.

## 3.2 Inheritance

`AppBaseModel` menjadi base class yang menyediakan field timestamp dan method bersama:

```typescript
export default class AppBaseModel extends BaseModel {
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  toSummary(): Record<string, any> {
    return {
      id: this.$getAttribute('id'),
      created: this.createdAt?.toFormat('yyyy-MM-dd HH:mm:ss'),
    }
  }
}
```

Model turunan yang terverifikasi:

```typescript
export default class Product extends AppBaseModel { ... }
export default class Category extends AppBaseModel { ... }
export default class ValidationLog extends AppBaseModel { ... }
```

Yang diwariskan:

- `createdAt`.
- `updatedAt`.
- Kemampuan Lucid `BaseModel` seperti query, save, delete, dan relasi model.
- Method `toSummary()`.

`Product` meng-override `toSummary()`:

```typescript
toSummary(): Record<string, any> {
  const baseSummary = super.toSummary()
  return {
    ...baseSummary,
    title: this.title,
    status: this.statusReview
  }
}
```

`User` juga menggunakan `AppBaseModel`, tetapi melalui komposisi class dengan auth finder:

```typescript
export default class User extends compose(AppBaseModel, AuthFinder) { ... }
```

## 3.3 Polymorphism

Polymorphism yang benar-benar terlihat di codebase adalah method overriding `toSummary()`.

Kode yang bekerja terhadap tipe base dapat memanggil `toSummary()`, tetapi implementasi aktual dapat berbeda untuk `Product` karena `Product` menambahkan `title` dan `status` ke hasil base.

Belum ada polymorphism berbasis Strategy seperti `SensitiveMatchStrategy` dan `NonSensitiveMatchStrategy`. Perbedaan mode matching saat ini direpresentasikan oleh parameter boolean:

```typescript
hitungSkorKemiripan(title, description, true)
hitungSkorKemiripan(title, description, false)
```

dan percabangan:

```typescript
if (isSensitive) {
  if (char1 === char2) { ... }
} else {
  if (char1.toLowerCase() === char2.toLowerCase()) { ... }
}
```

## 3.4 Abstraction

Abstraction utama berasal dari:

1. `SimilarityService`, yang menyembunyikan algoritma matching.
2. Interface `SimilarityResult`, yang mendefinisikan bentuk hasil skor.
3. Interface `ValidationResult`, yang mendefinisikan bentuk hasil validasi.
4. `BaseModel` dari Lucid, yang menyembunyikan detail persistence database.
5. `productValidator`, yang menjadi kontrak validasi payload.

Interface aktual:

```typescript
export interface SimilarityResult {
  matchCount: number
  totalChars: number
  percentage: number
}

export interface ValidationResult {
  scoreSensitive: number
  scoreNonSensitive: number
  threshold: number
  status: 'approved' | 'pending' | 'rejected'
}
```

Tidak ada `abstract class MatchStrategy` atau interface `MatchStrategy` di repository saat ini. Jika Strategy Pattern ingin ditambahkan, interface tersebut dapat menjadi kontrak baru, tetapi itu merupakan improvement dan bukan fitur yang sudah berjalan.

---

# 4. Design Pattern

## 4.1 Strategy Pattern: Status Implementasi

Requirement mengusulkan Strategy Pattern untuk memisahkan:

- `SensitiveMatchStrategy`.
- `NonSensitiveMatchStrategy`.

Tujuannya adalah menghindari percabangan `if (isSensitive)` dan memudahkan penambahan mode matching baru tanpa mengubah service utama. Dengan Strategy Pattern, service dapat menerima objek strategy yang memiliki method seperti `match(char1, char2)`.

Namun, codebase aktual belum menerapkan pola tersebut. Tidak ditemukan:

- Folder `app/strategies/`.
- `SensitiveMatchStrategy`.
- `NonSensitiveMatchStrategy`.
- Interface `MatchStrategy`.
- Dependency injection strategy ke `SimilarityService`.

Implementasi aktual masih berupa parameter boolean dan nested if:

```typescript
const sensitiveResult = this.hitungSkorKemiripan(title, description, true)
const nonSensitiveResult = this.hitungSkorKemiripan(title, description, false)
```

Untuk penilaian yang mensyaratkan Strategy Pattern, bagian ini perlu dianggap sebagai gap implementasi, bukan diklaim sudah ada.

## 4.2 Active Record Pattern

Lucid model menerapkan pendekatan Active Record: model merepresentasikan data sekaligus menyediakan operasi persistence.

Contoh dari controller:

```typescript
const product = new Product()
product.title = payload.title
product.description = payload.description
product.scoreSensitive = validationResult.scoreSensitive
product.statusReview = validationResult.status
await product.save()
```

Query dan CRUD juga dilakukan melalui model:

```typescript
const products = await Product.query()
  .preload('category')
  .orderBy('id', 'desc')

const product = await Product.findOrFail(params.id)
await product.delete()
```

Keuntungannya adalah operasi database dekat dengan model domain dan controller tidak perlu menulis SQL manual. Trade-off-nya adalah business logic dan persistence dapat cenderung bercampur jika controller terus bertambah kompleks.

## 4.3 Observer/Hook Pattern

`Product` memiliki lifecycle hook `@beforeSave()`:

```typescript
@beforeSave()
static async sanitizeData(product: Product) {
  if (product.$dirty.title) {
    product.title = product.title.trim()
  }
}
```

Hook ini dapat dijelaskan sebagai bentuk event-driven decoupling: normalisasi title otomatis dijalankan sebelum save/update tanpa harus dipanggil manual dari setiap controller.

Namun hook tersebut hanya melakukan sanitasi title. Validasi kemiripan dan logging tetap dilakukan eksplisit di `ProductsController`, bukan otomatis melalui hook.

---

# 5. Mapping Requirement ke Kode

| Requirement | Implementasi Aktual | File |
|---|---|---|
| Input handling | Validasi title, description, categoryId, price, stock, dan checkType menggunakan VineJS | `app/validators/product_validator.ts` |
| Nested loop | Loop karakter title terhadap karakter description | `app/services/similarity_service.ts` |
| Nested if | Cek karakter sudah dipakai, mode sensitive, lalu kecocokan karakter | `app/services/similarity_service.ts` |
| Struktur tracking match | Array boolean berdasarkan index karakter input kedua; bukan `Set<string>` | `app/services/similarity_service.ts` |
| Mathematics | `(matchCount / totalChars) * 100`, dengan `totalChars = trimmed1.length`, dibulatkan dua desimal, dan guard input pertama kosong | `app/services/similarity_service.ts` |
| Threshold decision | `approved >= 60`, `pending >= 25`, `rejected < 25` | `app/services/similarity_service.ts` |
| Create | Validasi payload, hitung skor, simpan Product, simpan ValidationLog | `app/controllers/products_controller.ts` |
| Read list | Ambil semua Product, preload category, urutkan berdasarkan ID | `app/controllers/products_controller.ts` |
| Read detail | Ambil satu Product, preload category dan validationLogs | `app/controllers/products_controller.ts` |
| Update | Validasi ulang payload, hitung ulang skor, update Product, tambah log | `app/controllers/products_controller.ts` |
| Delete | `findOrFail` lalu `product.delete()` | `app/controllers/products_controller.ts` |
| Reporting | Hitung total approved, pending, rejected, average score, success rate | `app/controllers/reports_controller.ts` |
| Persistence Product | Model Active Record Lucid dengan kolom product dan relasi | `app/models/product.ts` |
| Persistence Category | Model category dengan `name` dan `isSensitive` | `app/models/category.ts` |
| Persistence log | Model histori skor, threshold, dan status | `app/models/validation_log.ts` |
| Inheritance | Model turunan dari `AppBaseModel` | `app/models/app_base_model.ts`, `app/models/product.ts`, `app/models/category.ts`, `app/models/validation_log.ts` |
| Override / polymorphism | `Product.toSummary()` memanggil `super.toSummary()` lalu menambah field product | `app/models/product.ts` |
| Strategy Pattern | Belum diimplementasikan; matching masih memakai boolean dan if/else | `app/services/similarity_service.ts` |
| Active Record | Lucid model menyediakan query, save, delete, preload, dan findOrFail | `app/models/*.ts`, `app/controllers/products_controller.ts` |
| Observer / Hook | `@beforeSave()` menormalisasi title sebelum penyimpanan | `app/models/product.ts` |
| Database PostgreSQL | Konfigurasi client `pg` dan koneksi melalui environment | `config/database.ts` |
| Schema products | Kolom produk, foreign key user/category, skor, dan status | `database/migrations/1790147584449_create_products_table.ts` |
| Schema categories | Nama kategori dan flag sensitivitas | `database/migrations/1790147582843_create_categories_table.ts` |
| Schema validation logs | Skor, threshold, status, dan foreign key product | `database/migrations/1790147586038_create_validation_logs_table.ts` |

> Catatan: komentar lama pada migration dan `ValidationLog` masih menyebut `aman`, `perlu_review`, dan `ditolak`, sedangkan service dan data aplikasi saat ini menggunakan `approved`, `pending`, dan `rejected`. Nilai aktual yang menjadi kontrak runtime adalah nilai pada service.

---

# 6. Kesimpulan

## 6.1 Trade-off yang Diambil

1. **Nested loop `O(n x m)`** dipilih karena title dan description umumnya pendek. Algoritmanya mudah dibaca, mudah ditelusuri saat demo, dan memenuhi requirement nested loop.
2. **Array boolean** dipakai untuk tracking posisi karakter yang telah digunakan. Ini lebih tepat untuk duplicate berdasarkan posisi dibanding `Set<string>` sederhana, tetapi tidak memenuhi requirement literal penggunaan Set.
3. **Divisor panjang input pertama** mengikuti spesifikasi dan menunjukkan proporsi karakter input pertama yang ditemukan di input kedua. Metriknya masih merupakan character matching sederhana, bukan semantic similarity.
4. **Threshold global** membuat implementasi sederhana dan konsisten, tetapi belum memanfaatkan `Category.isSensitive` atau threshold yang berbeda per kategori.
5. **Status disimpan di Product dan ValidationLog**. Product menyimpan kondisi terbaru, sedangkan ValidationLog menyimpan histori audit setiap percobaan.
6. **Active Record Lucid** mempercepat pengembangan CRUD, tetapi controller masih memegang cukup banyak orchestration logic.
7. **Matching masih memakai if/else**, sehingga belum memperoleh fleksibilitas Strategy Pattern.

## 6.2 Potensi Improvement

- Implementasikan `MatchStrategy` dengan `SensitiveMatchStrategy` dan `NonSensitiveMatchStrategy` agar mode matching mengikuti Open-Closed Principle.
- Gunakan `Map<string, number>` atau struktur frekuensi jika ingin optimasi matching menjadi lebih dekat ke `O(n + m)` dan tetap menangani duplicate dengan benar.
- Pertimbangkan Levenshtein distance, Jaro-Winkler, token similarity, atau kombinasi beberapa metrik agar kemiripan teks lebih bermakna daripada pencocokan karakter.
- Jadikan threshold configurable per kategori, bukan konstanta global `25` dan batas approved `60` yang berada langsung di service.
- Gunakan `auth.user!.id` pada `ProductsController` daripada hardcode `userId = 1`.
- Tambahkan transaction database agar penyimpanan Product dan ValidationLog berhasil atau gagal sebagai satu kesatuan.
- Tambahkan test unit untuk kasus sensitive, non-sensitive, duplicate character, input kosong, string berbeda panjang, batas tepat 25%, dan batas tepat 60%.
- Selaraskan komentar migration dan model dengan status runtime `approved`, `pending`, dan `rejected`.
- Pisahkan report query dari controller ke service/repository khusus bila kebutuhan laporan bertambah.
- Tambahkan caching hanya jika profiling menunjukkan validasi yang sama sering dihitung berulang.

## Penutup

Secara keseluruhan, aplikasi sudah memiliki alur lengkap dari input, validasi, perhitungan skor, keputusan status, persistence, CRUD, hingga histori dan laporan. Kekuatan utama implementasi adalah pemisahan algoritma ke `SimilarityService`, penggunaan Lucid Active Record, dan pencatatan histori validasi. Gap terpenting terhadap rancangan requirement adalah belum adanya `Set<string>` secara literal dan belum diterapkannya Strategy Pattern.
