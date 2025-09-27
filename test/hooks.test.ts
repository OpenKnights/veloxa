import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest'
import { createMockServer } from 'create-mock-server'
import type { MockServer } from 'create-mock-server'
import { veloxa } from '../src/index'
import type { VeloxaContext } from '../src/types'
import { createError, readBody } from 'h3'

describe('Veloxa Hooks', () => {
  let server: MockServer

  beforeAll(async () => {
    server = createMockServer({
      routes: [
        {
          url: '/success',
          method: 'get',
          handler: async () => ({
            message: 'Success response',
            timestamp: Date.now()
          })
        },
        {
          url: '/error',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 400,
              statusMessage: 'Bad Request',
              data: { error: 'Something went wrong' }
            })
          }
        },
        {
          url: '/server-error',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 500,
              statusMessage: 'Internal Server Error'
            })
          }
        },
        {
          url: '/echo',
          method: 'post',
          handler: async (event) => {
            const body = await readBody(event)
            return { echo: body }
          }
        }
      ],
      port: 0
    })

    await server.listen()
  })

  afterAll(async () => {
    await server.close()
  })

  describe('onRequest Hook', () => {
    it('should call onRequest hook before making request', async () => {
      const onRequestSpy = vi.fn()

      const response = await veloxa(`${server.url}/success`, {
        onRequest: onRequestSpy
      })

      expect(onRequestSpy).toHaveBeenCalledOnce()
      expect(onRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(String),
          options: expect.any(Object)
        })
      )
      expect(response.message).toBe('Success response')
    })

    it('should allow modifying request in onRequest hook', async () => {
      const response = await veloxa(`${server.url}/echo`, {
        method: 'POST',
        body: { original: 'data' },
        onRequest: (context) => {
          // 修改请求体
          const body = context.options.body as Record<string, any>
          body.modified = true

          context.options.body = body
        }
      })

      expect(response.echo).toEqual({
        original: 'data',
        modified: true
      })
    })

    it('should support multiple onRequest hooks', async () => {
      const hook1 = vi.fn()
      const hook2 = vi.fn()

      await veloxa(`${server.url}/success`, {
        onRequest: [hook1, hook2]
      })

      expect(hook1).toHaveBeenCalledOnce()
      expect(hook2).toHaveBeenCalledOnce()
    })

    it('should allow adding headers in onRequest hook', async () => {
      const response = await veloxa(`${server.url}/success`, {
        onRequest: (context) => {
          context.options.headers.set('x-custom-header', 'custom-value')
          context.options.headers.set('authorization', 'Bearer token123')
        }
      })

      expect(response.message).toBe('Success response')
    })
  })

  describe('onResponse Hook', () => {
    it('should call onResponse hook after successful response', async () => {
      const onResponseSpy = vi.fn()

      const response = await veloxa(`${server.url}/success`, {
        onResponse: onResponseSpy
      })

      expect(onResponseSpy).toHaveBeenCalledOnce()
      expect(onResponseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(String),
          options: expect.any(Object),
          response: expect.objectContaining({
            status: 200,
            ok: true
          })
        })
      )
      expect(response.message).toBe('Success response')
    })

    it('should allow accessing response data in onResponse hook', async () => {
      let responseData: any = null

      await veloxa(`${server.url}/success`, {
        onResponse: (context) => {
          responseData = context.response._data
        }
      })

      expect(responseData).toEqual({
        message: 'Success response',
        timestamp: expect.any(Number)
      })
    })

    it('should support multiple onResponse hooks', async () => {
      const hook1 = vi.fn()
      const hook2 = vi.fn()

      await veloxa(`${server.url}/success`, {
        onResponse: [hook1, hook2]
      })

      expect(hook1).toHaveBeenCalledOnce()
      expect(hook2).toHaveBeenCalledOnce()
    })
  })

  describe('onRequestError Hook', () => {
    it('should allow handling request errors in hook', async () => {
      let capturedError: Error | null = null

      try {
        await veloxa('http://localhost:99999/nonexistent', {
          onRequestError: (context) => {
            capturedError = context.error
          }
        })
      } catch (error) {
        // 预期会抛出错误
      }

      expect(capturedError).toBeInstanceOf(Error)
    })
  })

  describe('onResponseError Hook', () => {
    it('should call onResponseError hook on HTTP error status', async () => {
      const onResponseErrorSpy = vi.fn()

      try {
        await veloxa(`${server.url}/error`, {
          onResponseError: onResponseErrorSpy
        })
      } catch (error) {
        // 预期会抛出错误
      }

      expect(onResponseErrorSpy).toHaveBeenCalledOnce()
      expect(onResponseErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(String),
          options: expect.any(Object),
          response: expect.objectContaining({
            status: 400,
            ok: false
          })
        })
      )
    })

    it('should allow accessing error response data in hook', async () => {
      let errorData: any = null

      try {
        await veloxa(`${server.url}/error`, {
          onResponseError: (context) => {
            errorData = context.response._data
          }
        })
      } catch (error) {
        // 预期会抛出错误
      }

      expect(errorData).toEqual({ error: 'Something went wrong' })
    })

    it('should not call onResponseError when ignoreResponseError is true', async () => {
      const onResponseErrorSpy = vi.fn()

      await veloxa(`${server.url}/error`, {
        ignoreResponseError: true,
        onResponseError: onResponseErrorSpy
      })

      expect(onResponseErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('Hook Execution Order', () => {
    it('should execute hooks in correct order for successful requests', async () => {
      const executionOrder: string[] = []

      await veloxa(`${server.url}/success`, {
        onRequest: () => {
          executionOrder.push('onRequest')
        },
        onResponse: () => {
          executionOrder.push('onResponse')
        },
        onRequestError: () => {
          executionOrder.push('onRequestError')
        },
        onResponseError: () => {
          executionOrder.push('onResponseError')
        }
      })

      expect(executionOrder).toEqual(['onRequest', 'onResponse'])
    })

    it('should execute hooks in correct order for request errors', async () => {
      const executionOrder: string[] = []

      try {
        await veloxa('http://localhost:99999/nonexistent', {
          onRequest: () => {
            executionOrder.push('onRequest')
          },
          onRequestError: () => {
            executionOrder.push('onRequestError')
          },
          onResponse: () => {
            executionOrder.push('onResponse')
          },
          onResponseError: () => {
            executionOrder.push('onResponseError')
          }
        })
      } catch (error) {
        // 预期会抛出错误
      }

      expect(executionOrder).toEqual(['onRequest', 'onRequestError'])
    })

    it('should execute hooks in correct order for response errors', async () => {
      const executionOrder: string[] = []

      try {
        await veloxa(`${server.url}/error`, {
          onRequest: () => {
            executionOrder.push('onRequest')
          },
          onRequestError: () => {
            executionOrder.push('onRequestError')
          },
          onResponse: () => {
            executionOrder.push('onResponse')
          },
          onResponseError: () => {
            executionOrder.push('onResponseError')
          }
        })
      } catch (error) {
        // 预期会抛出错误
      }

      expect(executionOrder).toEqual([
        'onRequest',
        'onResponse',
        'onResponseError'
      ])
    })
  })

  describe('Hook Context Modification', () => {
    it('should allow modifying request URL in onRequest hook', async () => {
      const response = await veloxa(`${server.url}/wrong-path`, {
        onRequest: (context) => {
          context.request = `${server.url}/success`
        }
      })

      expect(response.message).toBe('Success response')
    })

    it('should allow modifying request options in onRequest hook', async () => {
      const response = await veloxa(`${server.url}/echo`, {
        method: 'POST',
        body: { original: true },
        onRequest: (context) => {
          // 修改请求方法和body
          context.options.method = 'POST'
          context.options.body = JSON.stringify({ modified: true })
          context.options.headers.set('content-type', 'application/json')
        }
      })

      expect(response.echo).toEqual({ modified: true })
    })
  })

  describe('Async Hooks', () => {
    it('should handle async onRequest hooks', async () => {
      const asyncHook = vi
        .fn()
        .mockImplementation(async (context: VeloxaContext) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          context.options.headers.set('x-async-header', 'processed')
        })

      const response = await veloxa(`${server.url}/success`, {
        onRequest: asyncHook
      })

      expect(asyncHook).toHaveBeenCalledOnce()
      expect(response.message).toBe('Success response')
    })

    it('should handle async onResponse hooks', async () => {
      let processedData: any = null

      const response = await veloxa(`${server.url}/success`, {
        onResponse: async (context) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          processedData = { processed: context.response._data }
        }
      })

      expect(processedData).toEqual({
        processed: {
          message: 'Success response',
          timestamp: expect.any(Number)
        }
      })
      expect(response.message).toBe('Success response')
    })
  })

  describe('Hook Error Handling', () => {
    it('should handle errors thrown in onRequest hooks', async () => {
      const onRequestError = vi.fn()

      try {
        await veloxa(`${server.url}/success`, {
          onRequest: () => {
            throw new Error('Hook error')
          },
          onRequestError
        })
      } catch (error) {
        expect(error.message).toContain('Hook error')
      }
    })

    it('should continue execution if hook errors are handled', async () => {
      let hookErrorCaught = false

      const response = await veloxa(`${server.url}/success`, {
        onRequest: async (context) => {
          try {
            throw new Error('Handled hook error')
          } catch (error) {
            hookErrorCaught = true
            // 错误已处理，继续执行
          }
        }
      })

      expect(hookErrorCaught).toBe(true)
      expect(response.message).toBe('Success response')
    })
  })

  describe('Hook Context Immutability', () => {
    it('should provide access to all context properties', async () => {
      let contextSnapshot: any = null

      await veloxa(`${server.url}/success`, {
        onRequest: (context) => {
          contextSnapshot = {
            hasRequest: !!context.request,
            hasOptions: !!context.options,
            hasResponse: !!context.response,
            hasError: !!context.error
          }
        }
      })

      expect(contextSnapshot).toEqual({
        hasRequest: true,
        hasOptions: true,
        hasResponse: false, // onRequest 时还没有 response
        hasError: false
      })
    })

    it('should provide response context in onResponse hook', async () => {
      let contextSnapshot: any = null

      await veloxa(`${server.url}/success`, {
        onResponse: (context) => {
          contextSnapshot = {
            hasRequest: !!context.request,
            hasOptions: !!context.options,
            hasResponse: !!context.response,
            hasError: !!context.error,
            responseStatus: context.response?.status
          }
        }
      })

      expect(contextSnapshot).toEqual({
        hasRequest: true,
        hasOptions: true,
        hasResponse: true,
        hasError: false,
        responseStatus: 200
      })
    })
  })
})
