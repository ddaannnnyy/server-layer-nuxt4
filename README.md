# Server Boilerplate Layer

Welcome to my personal Nuxt Server Layer, this is a collection is boilerplate that I tend to use when working with Nuxt and Nitro.

## What the layer does

It includes:

- An overhauled api handler, allowing for mindless payload validation
- Traditional guard implementation, which can be used alongside server middleware but let you customise and stack required guards at each route.
- Batteries included Nitro cache handler, allowing you to easily add caches to your api endpoints

This isn't a full overhaul to replace how you work with Nitro, it's just a collection of things that I tend to do on every project, so a layer allows me to set and forget.

## Installation

Using a Nuxt Layer is simple, you can read the full documentation [here](https://nuxt.com/docs/4.x/getting-started/layers).

The short answer to get started is to simply extend this repo via Github. In your projects `nuxt.config.ts` simply add:

```
-> nuxt.config.ts
...
extends: [
    ['github:ddaannnnyy/server-layer-nuxt4', { install: true}]
]
...
```

The `install: true` flag means that the layer will install it's dependencies when mounted.

The only dependency currently is [zod 4](https://zod.dev)

## Examples

### Writing Server Routes

The simplest use of the event handler is very similar to how you would do it natively.

#### Hello World

`defineApiEventHandler` at minimum provides a handler which takes a function, which is executes when the server route is evoked.

```ts
// server/api/health.get.ts

export default defineApiEventHandler({
  handler: () => {
    return {
      status: 'ok',
    }
  },
})
```

This is an open route with no restrictions, so we don't need to add guards.
It also doesn't take any params, so we don't need to validate the request.

### Guards

This layer provides two guards, namely the two generics that I use for each project. When you extend the layer, they will be automatically available in the parent application.

#### Built-in Guards

- `userIsLoggedInGuard` guards against users who access the route without an Authorization header.

> Note: The default userIsLoggedInGuard does not check the Authorization header _content_. In order to keep the layer agnostic to how the parent application implements tokens. It will ONLY check for the existence of an Authorization header, as well as default incorrect values. e.g. "Bearer undefined".

> I recommend overriding the `/server/guards/authGuards.ts` file in the parent application with auth guards specific to your implementation.

- `devOnlyGuard` runs successfully in dev environments but will return a 403 if accessed in a production environment.

#### Implementing Guards

If we wanted to add a guard, we can pass it to `defineApiEventHandler` alongside the handler.

> Guards are passed as an array of functions

```ts
// server/api/health.get.ts
export default defineApiEventHandler({
  handler: () => {
    return {
      status: 'ok'
    }
  },
  guards: [devOnlyGuard]
})
```

This application will successfully run when in dev, but will return a 403 if accessed in production.

Guards can also be stacked for more complicated fine-grain control. They are run in series based on their index in the array.

#### Adding your own Guards

Guards are defined in the `/server/guards` directory, and auto imported.

They're simple middleware-esque files that return `defineGuard(fn)` which will throw an error, otherwise return void and let the event handler continue.

```ts
export const userIsLoggedInGuard = defineGuard((event) => {
  const authorization = event.headers.get('Authorization')
  if (!authorization) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Auth Guard failed',
    })
  }
})
```

### Body Validation

The api event handler also provides api param validation through zod.

You can read more about z objects [here](https://zod.dev/api).

Pass a zod schema object to the validation object for automatic 422 Invalid request payload errors.

```ts
import { z } from 'zod'

export default defineApiEventHandler({
  handler: async (event) => {
    const { email } = await readBody(event)

    return {
      email
    }
  },
  guards: [devOnlyGuard],
  validation: z.object({
    email: z.email(),
  })
})
```

The validation works across URL params as well as a body payload, depending on the method.

```ts
validation: z.object({
  name: z.string()
})

/*
METHOD: GET
STATUS: 200
localhost:3000/api/test?name=hello

METHOD: GET
STATUS: 422
localhost:3000/api/test
*/
```

```ts
validation: z.object({
  name: z.string()
})

/*
METHOD: POST
STATUS: 200
fetch('localhost:3000/api/test', { method: 'POST', body: { name: 'hello' }});

METHOD: POST
STATUS: 200
fetch('localhost:3000/api/test', { method: 'POST', body: { name: 'hello', additional: 'value' }});

METHOD: POST
STATUS: 422
fetch('localhost:3000/api/test', { method: 'POST', body: { foo: bar }});
*/
```

> Note: The validation examples are loose object checks and are not run through a zod parse, meaning that additional params are allowed as long as required content is available. For strict checks replace `z.object({})` with `z.strictObject({})`

```ts
validation: z.strictObject({
  name: z.string()
})

/*
METHOD: GET
STATUS: 200
localhost:3000/api/test?name=hello

METHOD: GET
STATUS: 422
localhost:3000/api/test
*/
```

### Cache Handler

The cache handler allows for an easy way to wrap responses to your api endpoints.

By wrapping the request in the cacheHandler nitro will cache it automatically and manage the ttl and refreshing.

```ts
import { cacheHandler } from '#server/utils/cacheHandler'

const fetchFromCache = cacheHandler((event) => {
  return getContent()
})

export default defineApiEventHandler({
  handler: () => {
    const data = fetchFromCache(event)
    return data
  },
})

function getContent() {
  const now = new Date()
  return {
    now
  }
}
```

The default cache options are available on the [nitro documentation](https://nitro.build/docs/cache).

The util options are an extension of the [nitro shared and function-only options](https://nitro.build/docs/cache#options) with the addition of a boolean for ignoring the cache.

```ts
interface CacheControlOptions extends CacheOptions {
  ignore?: boolean
}
```

```ts
const defaultOptions: CacheControlOptions = {
  maxAge: 60 * 10, // 10 mins
  name: fn.name,
  staleMaxAge: -1, // send stale version to client while updating
  swr: false, // async reval cache
}
```

### Helper Utilities

The layer also provides some basic utilities that can be used when writing server routes.

#### getAuthorizationHeader

Returns the Authorization token from a request

```ts
const token = getAuthorizationHeader(event)
console.log(token) // Bearer xxxx-xxxx-xxx-xxx-xxxx
```

#### returnCacheIgnore

Useful for cached request in which you would like to be able to trigger fresh calls outside of the cache.
Checks for a URL param on the request matching `nocache`

```ts
// localhost:3000/api/health?nocache
// false

// In practice
const ignore = returnCacheIgnore(event)
console.log(ignore) // true

// localhost:3000/api/health
const ignore = returnCacheIgnore(event)
console.log(ignore)
```

A full example

```ts
import { cacheHandler } from '#server/utils/cacheHandler'

const fetchFromCache = cacheHandler((event) => {
  return getContent()
}, {
  ignore: returnCacheIgnore(event) // if nocache is included in the request url the cache will ignore
})

export default defineApiEventHandler({
  validation: z.object({
    // Important ! if using a z.strictObject the validation will fail if nocache isn't a valid option. You can get around this by declaring it as optional with a value. So ?nocache=true will pass, and missing will still pass, but use the cache
    nocache: z.boolean().optional()
  }),
  handler: () => {
    const data = fetchFromCache(event)
    return data
  },
})

function getContent() {
  const now = new Date()
  return {
    now
  }
}
```
