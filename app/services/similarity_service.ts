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

export default class SimilarityService {
  /**
   * Method Utama untuk Menghitung Skor Kemiripan Karakter
  * Persentase menggunakan panjang input pertama sebagai divisor.
   */
  public hitungSkorKemiripan(input1: string, input2: string, isSensitive: boolean): SimilarityResult {
    const trimmed1 = input1.trim()
    const trimmed2 = input2.trim()
    
    const totalChars = trimmed1.length
    
    // Handle edge case: jika kosong
    if (totalChars === 0) {
      return { matchCount: 0, totalChars: 0, percentage: 0 }
    }

    let matchCount = 0
    const chars2 = trimmed2.split('')
    const isMatched = new Array(chars2.length).fill(false)

    // ==========================================
    // [REQUIREMENT: Nested Loop]
    // ==========================================
    for (let i = 0; i < trimmed1.length; i++) {
      const char1 = trimmed1[i]
      
      for (let j = 0; j < chars2.length; j++) {
        const char2 = chars2[j]

        if (!isMatched[j]) {
          // ==========================================
          // [REQUIREMENT: Nested If]
          // ==========================================
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

    // ==========================================
    // [REQUIREMENT: Mathematics]
    // Pembagian menggunakan panjang input pertama sesuai spesifikasi
    // ==========================================
    let percentage = (matchCount / totalChars) * 100
    percentage = Math.round(percentage * 100) / 100

    return {
      matchCount,
      totalChars,
      percentage
    }
  }

  /**
   * Method untuk memvalidasi produk secara menyeluruh
   */
  public validasiProduk(title: string, description: string, checkType: 'sensitive' | 'non-sensitive'): ValidationResult {
    const sensitiveResult = this.hitungSkorKemiripan(title, description, true)
    const nonSensitiveResult = this.hitungSkorKemiripan(title, description, false)

    const finalScore = checkType === 'sensitive' ? sensitiveResult.percentage : nonSensitiveResult.percentage

    // Tentukan Batasan (Threshold)
    const threshold = 25 
    let status: ValidationResult['status'] = 'pending'

    // ==========================================
    // [REQUIREMENT: Nested If (Logika Bisnis)]
    // ==========================================
    if (finalScore >= 60) {
      status = 'approved' // Standar lolos diperketat menjadi 60%
    } else {
      if (finalScore >= threshold) {
        status = 'pending' // Zona abu-abu (25% - 59.99%)
      } else {
        status = 'rejected' // Di bawah threshold (< 25%)
      }
    }

    return {
      scoreSensitive: sensitiveResult.percentage,
      scoreNonSensitive: nonSensitiveResult.percentage,
      threshold: threshold,
      status: status
    }
  }
}