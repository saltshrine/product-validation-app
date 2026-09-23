import vine from '@vinejs/vine'

export const categoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3),
    isSensitive: vine.boolean().optional() // akan di-cast otomatis oleh Adonis dari form checkbox
  })
)