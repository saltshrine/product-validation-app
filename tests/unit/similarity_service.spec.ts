import { test } from '@japa/runner'
import SimilarityService from '#services/similarity_service'
import SensitiveMatchStrategy from '#strategies/sensitive_match_strategy'

test.group('SimilarityService', () => {
  const service = new SimilarityService()

  test('sensitive case: ABBCD vs Gallant Duck = 20%', ({ assert }) => {
    const result = service.validasiProduk('ABBCD', 'Gallant Duck', 'sensitive')

    assert.equal(result.scoreSensitive, 20)
    assert.equal(result.status, 'rejected')
  })

  test('non-sensitive case: ABBCD vs Gallant Duck = 60%', ({ assert }) => {
    const result = service.validasiProduk('ABBCD', 'Gallant Duck', 'non-sensitive')

    assert.equal(result.scoreNonSensitive, 60)
    assert.equal(result.status, 'approved')
  })

  test('duplicate character di input1 tidak dihitung dobel dari 1 posisi input2', ({ assert }) => {
    const result = service.hitungSkorKemiripan('AA', 'A', new SensitiveMatchStrategy())

    assert.equal(result.matchCount, 1)
    assert.equal(result.percentage, 50)
  })

  test('input kosong tidak menyebabkan division by zero', ({ assert }) => {
    const result = service.hitungSkorKemiripan('', 'apapun', new SensitiveMatchStrategy())

    assert.equal(result.percentage, 0)
  })

  test('batas tepat 25% menghasilkan status pending, bukan rejected', ({ assert }) => {
    const result = service.validasiProduk('ABCD', 'A___', 'sensitive')

    assert.equal(result.scoreSensitive, 25)
    assert.equal(result.status, 'pending')
  })
})
