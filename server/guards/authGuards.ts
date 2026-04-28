export const userIsLoggedInGuard = defineGuard((event) => {
  console.warn(`You're currently running the default userIsLoggedInGuard. This is fine for development, however it does not check the validity of the Auth token, simply that it exists. I recommend doing project specific verification of the Auth header`)
  const authorization = event.headers.get('Authorization')
  if (!authorization) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Auth Guard failed',
    })
  }
  if (authorization === 'Bearer undefined') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Bearer Undefined',
    })
  }
})
