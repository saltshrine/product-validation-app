import vine from '@vinejs/vine'

export const productValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3),
    description: vine.string().trim().minLength(5),
    categoryId: vine.number().positive(),
    price: vine.number().min(0),
    stock: vine.number().min(0),
    checkType: vine.enum(['sensitive', 'non-sensitive'])
  })
)