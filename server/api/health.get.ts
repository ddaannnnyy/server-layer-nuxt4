import { z } from 'zod'
import { mediaTypeCheck } from '../utils/mediaTypeCheck'

export default defineApiEventHandler({
  validation: z.object({}),
  guards: [],
  handler: () => {
    return {
      status: 'ok',
    }
  },
})
