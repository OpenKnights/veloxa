import type { MockServer } from 'create-mock-server'

import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { createMockServer } from 'create-mock-server'
import { getQuery, getRouterParam, setHeader, setResponseStatus } from 'h3'

import { veloxa } from '../src/index'

describe('Veloxa Basic Functionality', () => {
  let server: MockServer

  beforeAll(async () => {
    server = createMockServer({
      routes: [
        {
          url: '/basic',
          method: 'get',
          handler: async () => ({
            message: 'Hello from mock server',
            timestamp: Date.now()
          })
        },
        {
          url: '/users/:id',
          method: 'get',
          handler: async (event) => {
            const id = getRouterParam(event, 'id')
            return {
              id: parseInt(id || '1'),
              name: `User ${id}`,
              email: `user${id}@example.com`
            }
          }
        },
        {
          url: '/json',
          method: 'get',
          handler: async () => ({
            array: [1, 2, 3],
            nested: { key: 'value' },
            boolean: true,
            number: 42
          })
        },
        {
          url: '/text',
          method: 'get',
          handler: async (event) => {
            setHeader(event, 'content-type', 'text/plain')
            return 'Plain text response'
          }
        },
        {
          url: '/empty',
          method: 'get',
          handler: async (event) => {
            setResponseStatus(event, 204)
            return null
          }
        }
      ],
      port: 0 // 使用随机端口
    })

    await server.listen()
  })

  afterAll(async () => {
    await server.close()
  })

  describe('GET Requests', () => {
    it('should fetch JSON data successfully', async () => {
      const response = await veloxa(`${server.url}/basic`)
      console.log(`🚀 ~ server:`, server)
      console.log(`GET Requests 🚀 ~ response:`, response)

      expect(response).toHaveProperty('message', 'Hello from mock server')
      expect(response).toHaveProperty('timestamp')
      expect(typeof response.timestamp).toBe('number')
    })

    it('should handle URL parameters', async () => {
      const userId = 123
      const response = await veloxa(`${server.url}/users/${userId}`)

      expect(response).toEqual({
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`
      })
    })

    it('should handle complex JSON responses', async () => {
      const response = await veloxa(`${server.url}/json`)

      expect(response.array).toEqual([1, 2, 3])
      expect(response.nested).toEqual({ key: 'value' })
      expect(response.boolean).toBe(true)
      expect(response.number).toBe(42)
    })

    it('should handle text responses', async () => {
      const response = await veloxa(`${server.url}/text`, {
        responseType: 'text'
      })

      expect(response).toBe('Plain text response')
    })

    it('should handle empty responses', async () => {
      const response = await veloxa(`${server.url}/empty`)

      expect(response).toBeUndefined()
    })
  })

  describe('Base URL', () => {
    it('should use baseURL option', async () => {
      const response = await veloxa('/basic', {
        baseURL: server.url
      })

      expect(response).toHaveProperty('message', 'Hello from mock server')
    })

    it('should combine baseURL with relative paths', async () => {
      const response = await veloxa('users/456', {
        baseURL: server.url
      })

      expect(response).toEqual({
        id: 456,
        name: 'User 456',
        email: 'user456@example.com'
      })
    })
  })

  describe('Query Parameters', () => {
    beforeAll(async () => {
      // 添加查询参数测试路由
      server.router.get('/query', async (event) => {
        const query = getQuery(event)
        return { query }
      })
    })

    it('should handle query parameters', async () => {
      const response = await veloxa(`${server.url}/query`, {
        query: {
          name: 'john',
          age: 30,
          active: true
        }
      })

      expect(response.query).toEqual({
        name: 'john',
        age: '30', // Query params are strings
        active: 'true'
      })
    })
  })
})
