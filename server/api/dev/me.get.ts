import type { H3Event } from '#imports'
import { cacheHandler } from '#server/utils/cacheHandler'
import { getAuthorizationHeaders } from '#server/utils/getAuthorizationHeader'
import { devOnlyGuard } from '../../guards/envGuards'

const fetchFromCache = cacheHandler(async (event) => {
  return await getMe(event)
}, {
  ignore: true,
})

export default defineApiEventHandler({
  guards: [devOnlyGuard],
  handler: async (event) => {
    const data = await fetchFromCache(event)
    return data
  },
})

async function getMe(event: H3Event) {
  const fetchCachedPayload = cacheHandler(async () => {
    const token = getAuthorizationHeaders(event)
    const headers = event.headers.values().toArray()
    const context = event.context
    const rawEvent = event

    return {
      token,
      headers,
      context,
      event: rawEvent,
    }
  })

  return await fetchCachedPayload()
}
