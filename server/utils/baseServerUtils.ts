import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import type { z } from 'zod'
import { ZodError } from 'zod'

type Guard<T> = ReturnType<typeof defineGuard<T>>

interface ApiEventHandler<T extends EventHandlerRequest, D, S extends z.ZodType> {
  handler: (event: H3Event<T>, payload: z.infer<S>) => Promise<D> | D
  validation?: S
  guards?: Guard<z.infer<S>>[]
}

export function defineApiEventHandler<
  T extends EventHandlerRequest = EventHandlerRequest,
  D = unknown,
  S extends z.ZodType = z.ZodType,
>(
  handlerOrConfig: ApiEventHandler<T, D, S> | EventHandler<T, D>,
): EventHandler<T, D> {
  if (typeof handlerOrConfig === 'function') {
    return defineEventHandler(handlerOrConfig)
  }

  const { validation, handler, guards } = handlerOrConfig

  return defineEventHandler<T>(async (event: H3Event<T>) => {
    try {
      const rawData = await getPayload(event)
      const payload = await runValidation(rawData, validation)
      await runGuards(event, payload, guards)

      return handler(event, payload)
    }
    catch (err) {
      if (err instanceof ZodError) {
        throw createError({
          statusCode: 422,
          statusMessage: `Invalid request payload`,
          data: err,
        })
      }
      throw err
    }
  })
}

export function defineGuard<T>(callback: (event: H3Event, payload: T) => Promise<void> | void) {
  return callback
}

async function getPayload(event: H3Event) {
  const method = event.method

  let payload: Record<string, unknown> = getQuery(event) || {}

  if (['PUT', 'POST'].includes(method)) {
    const body = await readBody(event)
    payload = {
      ...payload,
      ...body,
    }
  }

  return {
    ...payload,
    ...event.context.params,
  }
}

async function runGuards<T>(event: H3Event, payload: T, guards?: Guard<T>[]) {
  if (!guards)
    return
  if (!Array.isArray(guards)) {
    throw createError({
      statusCode: 500,
      statusMessage: `Guards must be an array`,
    })
  }
  await Promise.all(guards.map(guard => guard(event, payload)))
}

async function runValidation<S extends z.ZodType>(
  data: unknown,
  validation?: S,
): Promise<z.infer<S>> {
  if (!validation)
    return data as z.infer<S>

  return await validation.parseAsync(data)
}
