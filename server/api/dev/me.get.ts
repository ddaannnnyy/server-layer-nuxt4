import type { H3Event } from 'h3'
import { devOnlyGuard } from '../../guards/envGuards'
import { cacheHandler } from '../../utils/cacheHandler'
import { getAuthorizationHeaders } from '../../utils/getAuthorizationHeader'

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
