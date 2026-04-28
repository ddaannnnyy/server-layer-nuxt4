import type { H3Event } from '#imports'

export function returnCacheIgnore(event: H3Event) {
  const { nocache } = getQuery(event)
  return !!nocache
}
