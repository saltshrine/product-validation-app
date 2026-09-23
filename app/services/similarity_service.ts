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
  checkType: 'sensitive' | 'non-sensitive'
}

import type MatchStrategy from '../strategies/match_strategy.js'
import NonSensitiveMatchStrategy from '../strategies/non_sensitive_match_strategy.js'
import SensitiveMatchStrategy from '../strategies/sensitive_match_strategy.js'

export default class SimilarityService {
  public hitungSkorKemiripan(
    input1: string,
    input2: string,
    strategy: MatchStrategy
  ): SimilarityResult {
    const trimmed1 = input1.trim()
    const trimmed2 = input2.trim()

    const totalChars = trimmed1.length

    if (totalChars === 0) {
      return { matchCount: 0, totalChars: 0, percentage: 0 }
    }

    let matchCount = 0
    const chars2 = trimmed2.split('')
    const isMatched = new Array(chars2.length).fill(false)

    for (let i = 0; i < trimmed1.length; i++) {
      const char1 = trimmed1[i]

      for (let j = 0; j < chars2.length; j++) {
        const char2 = chars2[j]

        if (!isMatched[j]) {
          if (strategy.match(char1, char2)) {
            matchCount++
            isMatched[j] = true
            break
          }
        }
      }
    }

    let percentage = (matchCount / totalChars) * 100
    percentage = Math.round(percentage * 100) / 100

    return {
      matchCount,
      totalChars,
      percentage,
    }
  }

  public validasiProduk(
    title: string,
    description: string,
    checkType: 'sensitive' | 'non-sensitive'
  ): ValidationResult {
    const sensitiveStrategy = new SensitiveMatchStrategy()
    const nonSensitiveStrategy = new NonSensitiveMatchStrategy()

    const sensitiveResult = this.hitungSkorKemiripan(title, description, sensitiveStrategy)
    const nonSensitiveResult = this.hitungSkorKemiripan(title, description, nonSensitiveStrategy)

    const finalScore =
      checkType === 'sensitive' ? sensitiveResult.percentage : nonSensitiveResult.percentage

    const threshold = 25
    let status: ValidationResult['status'] = 'pending'

    if (finalScore >= 60) {
      status = 'approved'
    } else if (finalScore >= threshold) {
      status = 'pending'
    } else {
      status = 'rejected'
    }

    return {
      scoreSensitive: sensitiveResult.percentage,
      scoreNonSensitive: nonSensitiveResult.percentage,
      threshold,
      status,
      checkType,
    }
  }
}
