import type { H3Event } from '#imports'

export function getAuthorizationHeaders(event: H3Event) {
  const bearerToken = event.headers.get('Authorization')
  return bearerToken
}
