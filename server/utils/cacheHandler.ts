import type { CacheOptions } from 'nitropack/types'
import { defu } from 'defu'

interface CacheControlOptions extends CacheOptions {
  ignore?: boolean
}

export function cacheHandler<T>(fn: (...args: any[]) => T | Promise<T>, options?: CacheControlOptions) {
  const defaultOptions: CacheControlOptions = {
    maxAge: 60 * 10, // 10 mins
    name: fn.name,
    staleMaxAge: -1, // send stale version to client while updating
    swr: false, // async reval cache
  }

  const mergedOptions = defu(options, defaultOptions)

  if (options?.ignore) {
    return fn
  }
  else {
    return defineCachedFunction<T>(fn, mergedOptions)
  }
}
