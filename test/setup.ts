import type { AppServer } from 'better-mock-server'

import { createAppServer } from 'better-mock-server'
import { HTTPError, readBody } from 'h3'
import { afterAll, beforeAll } from 'vitest'

// eslint-disable-lint import/no-mutable-exports
export let mockServer: AppServer

type Recordable<T = any> = Record<string, T>

// console.log('111')

/**
 * Setup mock server before all tests
 */
beforeAll(async () => {
  mockServer = await createAppServer({
    port: 0, // Use random available port
    autoListen: true,
    routes: {
      // Success responses
      '/api/users': {
        GET: () => [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' }
        ],
        POST: async (event) => {
          const body = await readBody<Recordable>(event)

          return {
            id: Date.now(),
            ...(!!body && body.constructor === Object
              ? body
              : { params: body }),
            createdAt: new Date().toISOString()
          }
        }
      },

      '/api/users/:id': {
        GET: (event) => {
          const id = event.context.params?.id
          return {
            id: Number(id),
            name: `User ${id}`,
            email: `user${id}@example.com`
          }
        },
        PUT: async (event) => {
          const id = event.context.params?.id
          const body = await readBody<Recordable>(event)
          return {
            id: Number(id),
            ...(!!body && body.constructor === Object
              ? body
              : { params: body }),
            updatedAt: new Date().toISOString()
          }
        },
        DELETE: (event) => {
          const id = event.context.params?.id
          return {
            success: true,
            deletedId: Number(id)
          }
        }
      },

      '/api/text': {
        GET: (event) => {
          event.res.headers.set('content-type', 'text/plain')
          return 'Plain text response'
        }
      },

      '/api/html': {
        GET: (event) => {
          event.res.headers.set('content-type', 'text/html')
          return '<h1>HTML Response</h1>'
        }
      },

      '/api/blob': {
        GET: (event) => {
          event.res.headers.set('content-type', 'application/octet-stream')
          return Buffer.from('binary data')
        }
      },

      '/api/empty': {
        GET: () => {
          throw HTTPError.status(204, 'Empty Request')
        }
      },

      '/api/query': {
        GET: (event) => {
          const query = event.req.url?.split('?')[1] || ''
          const params = new URLSearchParams(query)
          return {
            received: Object.fromEntries(params.entries())
          }
        }
      },

      // Error responses
      '/api/error/400': {
        GET: () => {
          throw new HTTPError({
            status: 400,
            statusText: 'Bad Request',
            message: 'Invalid request parameters'
          })
        }
      },

      '/api/error/401': {
        GET: () => {
          throw new HTTPError({
            status: 401,
            statusText: 'Unauthorized',
            message: 'Authentication required'
          })
        }
      },

      '/api/error/404': {
        GET: () => {
          throw new HTTPError({
            status: 404,
            statusText: 'Not Found',
            message: 'Resource not found'
          })
        }
      },

      '/api/error/500': {
        GET: () => {
          throw new HTTPError({
            status: 500,
            statusText: 'Internal Server Error',
            message: 'Something went wrong'
          })
        }
      },

      // Timeout simulation
      '/api/slow': {
        GET: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000))
          return { message: 'Slow response' }
        }
      },

      // Custom headers
      '/api/headers': (event) => {
        return {
          received: Object.fromEntries(event.req.headers.entries())
        }
      },

      // Form data
      '/api/form': {
        POST: async (event) => {
          const body = await readBody<Recordable>(event)
          return {
            received: body,
            contentType: event.req.headers.get('content-type')
          }
        }
      },

      // PATCH method
      '/api/patch/:id': {
        PATCH: async (event) => {
          const id = event.context.params?.id
          const body = await readBody<Recordable>(event)
          return {
            id: Number(id),
            ...(!!body && body.constructor === Object
              ? body
              : { params: body }),
            patched: true
          }
        }
      }
    }
  })

  console.log(`Mock server running at ${mockServer.url}`)
})

/**
 * Cleanup mock server after all tests
 */
afterAll(async () => {
  await mockServer.close()
  console.log('Mock server closed')
})

/**
 * Get the base URL of the mock server
 */
export function getMockUrl(path: string = ''): string {
  const base = (mockServer.url || '').replace(/\/$/, '')

  if (!path) {
    return base
  }

  return `${base}/${path.replace(/^\//, '')}`
}
