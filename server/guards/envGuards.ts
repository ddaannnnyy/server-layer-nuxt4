export const devOnlyGuard = defineGuard(() => {
  const dev = import.meta.dev
  if (!dev) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
  }
})
