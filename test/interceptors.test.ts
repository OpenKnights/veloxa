import { describe, it, expect, vi } from 'vitest'
import { veloxa } from '../src'
import { getMockUrl } from './setup'

describe('Interceptors', () => {
  describe('onRequest Interceptor', () => {
    it('should call onRequest before sending request', async () => {
      const onRequest = vi.fn()

      await veloxa(getMockUrl('/api/users'), {
        onRequest
      })

      expect(onRequest).toHaveBeenCalledTimes(1)
      expect(onRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(String),
          options: expect.any(Object)
        })
      )
    })

    it('should allow modifying request in onRequest', async () => {
      const data = await veloxa(getMockUrl('/api/headers'), {
        onRequest: (context) => {
          context.options.headers.set('X-Modified', 'true')
        }
      })

      expect(data.received['x-modified']).toBe('true')
    })

    it('should support multiple onRequest interceptors', async () => {
      const interceptor1 = vi.fn()
      const interceptor2 = vi.fn()

      await veloxa(getMockUrl('/api/users'), {
        onRequest: [interceptor1, interceptor2]
      })

      expect(interceptor1).toHaveBeenCalledTimes(1)
      expect(interceptor2).toHaveBeenCalledTimes(1)
    })

    it('should execute onRequest interceptors in order', async () => {
      const order: number[] = []

      await veloxa(getMockUrl('/api/users'), {
        onRequest: [
          () => {
            order.push(1)
          },
          () => {
            order.push(2)
          },
          () => {
            order.push(3)
          }
        ]
      })

      expect(order).toEqual([1, 2, 3])
    })
  })

  describe('onRequestError Interceptor', () => {
    it('should call onRequestError on network failure', async () => {
      const onRequestError = vi.fn()

      try {
        await veloxa('http://localhost:1/nonexistent', {
          onRequestError
        })
      } catch {
        // Expected to throw
      }

      expect(onRequestError).toHaveBeenCalledTimes(1)
      expect(onRequestError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error)
        })
      )
    })

    it('should call onRequestError on timeout', async () => {
      const onRequestError = vi.fn()

      try {
        await veloxa(getMockUrl('/api/slow'), {
          timeout: 500,
          onRequestError
        })
      } catch {
        // Expected to throw
      }

      expect(onRequestError).toHaveBeenCalledTimes(1)
    }, 10000)
  })

  describe('onResponse Interceptor', () => {
    it('should call onResponse after successful request', async () => {
      const onResponse = vi.fn()

      await veloxa(getMockUrl('/api/users'), {
        onResponse
      })

      expect(onResponse).toHaveBeenCalledTimes(1)
      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({
            status: 200,
            _data: expect.any(Array)
          })
        })
      )
    })

    it('should allow modifying response data in onResponse', async () => {
      const data = await veloxa(getMockUrl('/api/users'), {
        onResponse: (context) => {
          context.response._data = {
            modified: true,
            original: context.response._data
          }
        }
      })

      expect(data).toHaveProperty('modified', true)
      expect(data).toHaveProperty('original')
      expect(Array.isArray(data.original)).toBe(true)
    })

    it('should support multiple onResponse interceptors', async () => {
      const interceptor1 = vi.fn()
      const interceptor2 = vi.fn()

      await veloxa(getMockUrl('/api/users'), {
        onResponse: [interceptor1, interceptor2]
      })

      expect(interceptor1).toHaveBeenCalledTimes(1)
      expect(interceptor2).toHaveBeenCalledTimes(1)
    })

    it('should not call onResponse on request error', async () => {
      const onResponse = vi.fn()

      try {
        await veloxa('http://localhost:1/nonexistent', {
          onResponse
        })
      } catch {
        // Expected to throw
      }

      expect(onResponse).not.toHaveBeenCalled()
    })
  })

  describe('onResponseError Interceptor', () => {
    it('should call onResponseError on 4xx error', async () => {
      const onResponseError = vi.fn()

      try {
        await veloxa(getMockUrl('/api/error/404'), {
          onResponseError
        })
      } catch {
        // Expected to throw
      }

      expect(onResponseError).toHaveBeenCalledTimes(1)
      expect(onResponseError).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({
            status: 404
          })
        })
      )
    })

    it('should call onResponseError on 5xx error', async () => {
      const onResponseError = vi.fn()

      try {
        await veloxa(getMockUrl('/api/error/500'), {
          onResponseError
        })
      } catch {
        // Expected to throw
      }

      expect(onResponseError).toHaveBeenCalledTimes(1)
      expect(onResponseError).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({
            status: 500
          })
        })
      )
    })

    it('should not call onResponseError on successful response', async () => {
      const onResponseError = vi.fn()

      await veloxa(getMockUrl('/api/users'), {
        onResponseError
      })

      expect(onResponseError).not.toHaveBeenCalled()
    })

    it('should support multiple onResponseError interceptors', async () => {
      const interceptor1 = vi.fn()
      const interceptor2 = vi.fn()

      try {
        await veloxa(getMockUrl('/api/error/404'), {
          onResponseError: [interceptor1, interceptor2]
        })
      } catch {
        // Expected to throw
      }

      expect(interceptor1).toHaveBeenCalledTimes(1)
      expect(interceptor2).toHaveBeenCalledTimes(1)
    })

    it('should allow custom error handling in onResponseError', async () => {
      let errorHandled = false

      try {
        await veloxa(getMockUrl('/api/error/404'), {
          onResponseError: (context) => {
            errorHandled = true
            expect(context.response.status).toBe(404)
          }
        })
      } catch {
        // Expected to throw
      }

      expect(errorHandled).toBe(true)
    })
  })

  describe('Complete Interceptor Chain', () => {
    it('should execute interceptors in correct order', async () => {
      const order: string[] = []

      await veloxa(getMockUrl('/api/users'), {
        onRequest: () => {
          order.push('onRequest')
        },
        onResponse: () => {
          order.push('onResponse')
        }
      })

      expect(order).toEqual(['onRequest', 'onResponse'])
    })

    it('should execute all interceptors for error case', async () => {
      const order: string[] = []

      try {
        await veloxa(getMockUrl('/api/error/404'), {
          onRequest: () => {
            order.push('onRequest')
          },
          onResponse: () => {
            order.push('onResponse')
          },
          onResponseError: () => {
            order.push('onResponseError')
          }
        })
      } catch {
        // Expected to throw
      }

      expect(order).toEqual(['onRequest', 'onResponseError'])
      expect(order).not.toContain('onResponse')
    })

    it('should handle async interceptors', async () => {
      const data = await veloxa(getMockUrl('/api/users'), {
        onRequest: async (context) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          context.options.headers.set('X-Async', 'true')
        },
        onResponse: async (context) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          context.response._data = {
            async: true,
            data: context.response._data
          }
        }
      })

      expect(data).toHaveProperty('async', true)
      expect(data).toHaveProperty('data')
    })
  })

  describe('Interceptor Context', () => {
    it('should provide full context to onRequest', async () => {
      let capturedContext: any

      await veloxa(getMockUrl('/api/users'), {
        onRequest: (context) => {
          capturedContext = context
        }
      })

      expect(capturedContext).toHaveProperty('request')
      expect(capturedContext).toHaveProperty('options')
      expect(capturedContext.options).toHaveProperty('headers')
      expect(capturedContext.options.headers).toBeInstanceOf(Headers)
    })

    it('should provide full context to onResponse', async () => {
      let capturedContext: any

      await veloxa(getMockUrl('/api/users'), {
        onResponse: (context) => {
          capturedContext = context
        }
      })

      expect(capturedContext).toHaveProperty('request')
      expect(capturedContext).toHaveProperty('options')
      expect(capturedContext).toHaveProperty('response')
      expect(capturedContext.response).toHaveProperty('status')
      expect(capturedContext.response).toHaveProperty('_data')
    })
  })
})
