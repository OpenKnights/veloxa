import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { createMockServer } from 'create-mock-server'
import type { MockServer } from 'create-mock-server'
import { veloxa } from '../src/index'
import { VeloxaError } from '../src/error'
import { createError } from 'h3'

describe('Veloxa Error Handling', () => {
  let server: MockServer

  beforeAll(async () => {
    server = createMockServer({
      routes: [
        // 400 Bad Request
        {
          url: '/bad-request',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 400,
              statusMessage: 'Bad Request',
              data: { error: 'Invalid parameters' }
            })
          }
        },

        // 401 Unauthorized
        {
          url: '/unauthorized',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 401,
              statusMessage: 'Unauthorized',
              data: { error: 'Authentication required' }
            })
          }
        },

        // 403 Forbidden
        {
          url: '/forbidden',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 403,
              statusMessage: 'Forbidden',
              data: { error: 'Access denied' }
            })
          }
        },

        // 404 Not Found
        {
          url: '/not-found',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 404,
              statusMessage: 'Not Found',
              data: { error: 'Resource not found' }
            })
          }
        },

        // 500 Internal Server Error
        {
          url: '/server-error',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 500,
              statusMessage: 'Internal Server Error',
              data: { error: 'Something went wrong' }
            })
          }
        },

        // 502 Bad Gateway (可重试)
        {
          url: '/bad-gateway',
          method: 'get',
          handler: async (event) => {
            throw createError({
              statusCode: 502,
              statusMessage: 'Bad Gateway',
              data: { error: 'Upstream error' }
            })
          }
        },

        // 延迟响应 (用于超时测试)
        {
          url: '/slow',
          method: 'get',
          handler: async () => {
            await new Promise((resolve) => setTimeout(resolve, 2000)) // 2秒延迟
            return { message: 'Slow response' }
          }
        },

        // 成功响应 (用于重试测试)
        {
          url: '/eventually-success',
          method: 'get',
          handler: (() => {
            let attemptCount = 0
            return async (event) => {
              attemptCount++
              if (attemptCount < 3) {
                throw createError({
                  statusCode: 500,
                  statusMessage: 'Temporary Error'
                })
              }
              return { success: true, attempt: attemptCount }
            }
          })()
        }
      ],
      port: 0
    })

    await server.listen()
  })

  afterAll(async () => {
    await server.close()
  })

  describe('HTTP Error Status Codes', () => {
    it('should throw VeloxaError for 400 Bad Request', async () => {
      await expect(veloxa(`${server.url}/bad-request`)).rejects.toThrow(
        VeloxaError
      )

      try {
        await veloxa(`${server.url}/bad-request`)
      } catch (error) {
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(400)
        expect(error.statusMessage).toBe('Bad Request')
        expect(error.data.data).toEqual({ error: 'Invalid parameters' })
      }
    })

    it('should throw VeloxaError for 401 Unauthorized', async () => {
      try {
        await veloxa(`${server.url}/unauthorized`)
      } catch (error) {
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(401)
        expect(error.statusMessage).toBe('Unauthorized')
        expect(error.data.data).toEqual({ error: 'Authentication required' })
      }
    })

    it('should throw VeloxaError for 403 Forbidden', async () => {
      try {
        await veloxa(`${server.url}/forbidden`)
      } catch (error) {
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(403)
        expect(error.statusMessage).toBe('Forbidden')
      }
    })

    it('should throw VeloxaError for 404 Not Found', async () => {
      try {
        await veloxa(`${server.url}/not-found`)
      } catch (error) {
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(404)
        expect(error.statusMessage).toBe('Not Found')
      }
    })

    it('should throw VeloxaError for 500 Internal Server Error', async () => {
      try {
        await veloxa(`${server.url}/server-error`)
      } catch (error) {
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(500)
        expect(error.statusMessage).toBe('Internal Server Error')
      }
    })
  })

  describe('Error Response Ignoring', () => {
    it('should ignore response errors when ignoreResponseError is true', async () => {
      const response = await veloxa(`${server.url}/bad-request`, {
        ignoreResponseError: true
      })

      // 应该返回错误数据而不是抛出异常
      expect(response.data).toEqual({ error: 'Invalid parameters' })
    })

    it('should still process error data when ignoring errors', async () => {
      const response = await veloxa(`${server.url}/server-error`, {
        ignoreResponseError: true
      })

      expect(response.data).toEqual({ error: 'Something went wrong' })
    })
  })

  describe('Network Errors', () => {
    it('should handle invalid URLs', async () => {
      await expect(veloxa('invalid-url')).rejects.toThrow()
    })
  })

  describe('Timeout Handling', () => {
    it('should timeout and throw error for slow requests', async () => {
      try {
        await veloxa(`${server.url}/slow`, {
          timeout: 500 // 500ms 超时
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.cause.name).toBe('TimeoutError')
        expect(error.message).toContain('timeout')
      }
    })

    it('should not timeout for fast requests', async () => {
      await expect(
        veloxa(`${server.url}/not-found`, {
          timeout: 1000,
          ignoreResponseError: true
        })
      ).resolves.toBeDefined()
    })
  })

  describe('Retry Mechanism', () => {
    it('should retry on retryable status codes', async () => {
      const startTime = Date.now()

      try {
        await veloxa(`${server.url}/bad-gateway`, {
          retry: 2,
          retryDelay: 100
        })
      } catch (error) {
        const duration = Date.now() - startTime
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(502)
        // 应该有重试延迟
        expect(duration).toBeGreaterThanOrEqual(200) // 2次重试 * 100ms延迟
      }
    })

    it('should not retry on non-retryable status codes', async () => {
      const startTime = Date.now()

      try {
        await veloxa(`${server.url}/bad-request`, {
          retry: 2,
          retryDelay: 100
        })
      } catch (error) {
        const duration = Date.now() - startTime
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(400)
        // 不应该有明显的重试延迟
        expect(duration).toBeLessThan(50)
      }
    })

    it('should succeed after retries', async () => {
      const response = await veloxa(`${server.url}/eventually-success`, {
        retry: 3,
        retryDelay: 50
      })

      expect(response.success).toBe(true)
      expect(response.attempt).toBe(3)
    })

    it('should respect custom retryStatusCodes', async () => {
      try {
        await veloxa(`${server.url}/bad-request`, {
          retry: 2,
          retryStatusCodes: [400], // 将400设为可重试
          retryDelay: 100
        })
      } catch (error) {
        const duration = Date.now()
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.statusCode).toBe(400)
      }
    })

    it('should handle dynamic retry delay', async () => {
      const delays: number[] = []

      try {
        await veloxa(`${server.url}/server-error`, {
          retry: 2,
          retryDelay: (context) => {
            const delay = 100 * (context.response?.status === 500 ? 2 : 1)
            delays.push(delay)
            return delay
          }
        })
      } catch (error) {
        expect(error).toBeInstanceOf(VeloxaError)
        expect(delays).toHaveLength(2)
        expect(delays[0]).toBe(200)
        expect(delays[1]).toBe(200)
      }
    })
  })

  describe('Abort Signal', () => {
    it('should handle manual abort', async () => {
      const controller = new AbortController()

      // 立即中止请求
      setTimeout(() => controller.abort(), 10)

      try {
        await veloxa(`${server.url}/slow`, {
          signal: controller.signal
        })
      } catch (error) {
        expect(error.cause.name).toBe('AbortError')
      }
    })

    it('should not retry on manual abort', async () => {
      const controller = new AbortController()
      const startTime = Date.now()

      setTimeout(() => controller.abort(), 10)

      try {
        await veloxa(`${server.url}/slow`, {
          signal: controller.signal,
          retry: 3,
          retryDelay: 100
        })
      } catch (error) {
        const duration = Date.now() - startTime
        expect(error.cause.name).toBe('AbortError')
        // 不应该有重试延迟
        expect(duration).toBeLessThan(100)
      }
    })
  })
})
