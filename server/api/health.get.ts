import { z } from 'zod'

export default defineApiEventHandler({
  validation: z.object({}),
  guards: [],
  handler: () => {
    return {
      status: 'ok',
    }
  },
})
