import type { VeloxaError } from '../src'

import { describe, expect, it } from 'vitest'

import { createVeloxa, veloxa } from '../src'
import { getMockUrl } from './setup'

describe('Headers and Options', () => {
  describe('Request Headers', () => {
    it('should send custom headers', async () => {
      const data = await veloxa(getMockUrl('/api/headers'), {
        headers: {
          'X-Custom-Header': 'test-value',
          'X-Another-Header': 'another-value'
        }
      })

      expect(data.received['x-custom-header']).toBe('test-value')
      expect(data.received['x-another-header']).toBe('another-value')
    })

    it('should handle Headers object', async () => {
      const headers = new Headers()
      headers.set('X-Test', 'value')

      const data = await veloxa(getMockUrl('/api/headers'), {
        headers
      })

      expect(data.received['x-test']).toBe('value')
    })

    it('should set content-type for JSON automatically', async () => {
      const data = await veloxa(getMockUrl('/api/form'), {
        method: 'POST',
        body: {
          name: 'test'
        }
      })

      expect(data.contentType).toBe('application/json')
    })

    it('should respect custom content-type', async () => {
      const data = await veloxa(getMockUrl('/api/form'), {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: {
          username: 'test',
          password: 'secret'
        }
      })

      expect(data.contentType).toBe('application/x-www-form-urlencoded')
    })

    it('should set accept header automatically for JSON', async () => {
      const data = await veloxa(getMockUrl('/api/headers'), {
        method: 'POST',
        body: { test: true }
      })

      expect(data.received.accept).toBe('application/json')
    })

    it('should merge headers correctly', async () => {
      const api = createVeloxa({
        baseURL: getMockUrl(),
        headers: {
          'X-Default': 'default'
        }
      })

      const data = await api('/api/headers', {
        headers: {
          'X-Request': 'request'
        }
      })

      expect(data.received['x-default']).toBe('default')
      expect(data.received['x-request']).toBe('request')
    })

    it('should override default headers with request headers', async () => {
      const api = createVeloxa({
        baseURL: getMockUrl(),
        headers: {
          'X-Override': 'default'
        }
      })

      const data = await api('/api/headers', {
        headers: {
          'X-Override': 'overridden'
        }
      })

      expect(data.received['x-override']).toBe('overridden')
    })
  })

  describe('Query Parameters', () => {
    it('should append query parameters', async () => {
      const data = await veloxa(getMockUrl('/api/query'), {
        query: {
          page: 1,
          limit: 20
        }
      })

      expect(data.received).toEqual({
        page: '1',
        limit: '20'
      })
    })

    it('should handle multiple query parameters', async () => {
      const data = await veloxa(getMockUrl('/api/query'), {
        query: {
          filter: 'active',
          sort: 'name',
          order: 'asc',
          page: 1
        }
      })

      expect(data.received).toEqual({
        filter: 'active',
        sort: 'name',
        order: 'asc',
        page: '1'
      })
    })

    it('should encode query parameters', async () => {
      const data = await veloxa(getMockUrl('/api/query'), {
        query: {
          search: 'hello world',
          special: 'a+b=c'
        }
      })

      expect(data.received.search).toBe('hello world')
      expect(data.received.special).toBe('a+b=c')
    })

    it('should merge query with existing URL query', async () => {
      const data = await veloxa(getMockUrl('/api/query?existing=value'), {
        query: {
          new: 'param'
        }
      })

      expect(data.received).toHaveProperty('existing', 'value')
      expect(data.received).toHaveProperty('new', 'param')
    })
  })

  describe('baseURL Option', () => {
    it('should prepend baseURL to relative paths', async () => {
      const data = await veloxa('/api/users', {
        baseURL: getMockUrl()
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should handle baseURL with trailing slash', async () => {
      const data = await veloxa('api/users', {
        baseURL: `${getMockUrl()}/`
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should handle path with leading slash', async () => {
      const data = await veloxa('/api/users', {
        baseURL: getMockUrl()
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should work with createVeloxa default baseURL', async () => {
      const api = createVeloxa({
        baseURL: getMockUrl()
      })

      const data = await api('/api/users')
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Request Body', () => {
    it('should send JSON body', async () => {
      const body = {
        name: 'John',
        email: 'john@example.com'
      }

      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'POST',
        body
      })

      expect(data.name).toBe('John')
      expect(data.email).toBe('john@example.com')
    })

    it('should send string body as-is', async () => {
      const body = JSON.stringify({ test: true })

      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body
      })

      expect(data).toHaveProperty('test', true)
    })

    it('should handle nested objects in body', async () => {
      const body = {
        user: {
          name: 'John',
          details: {
            age: 30,
            city: 'NYC'
          }
        }
      }

      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'POST',
        body
      })

      expect(data.user).toEqual(body.user)
    })

    it('should handle array body', async () => {
      const body = [1, 2, 3, 4, 5]

      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'POST',
        body
      })

      expect(Array.isArray(data.params)).toBe(true)
    })

    it('should not send body for GET requests', async () => {
      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'GET'
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Timeout Option', () => {
    it('should allow long requests without timeout', async () => {
      // This should not timeout since no timeout is set
      const data = await veloxa(getMockUrl('/api/users'))

      expect(data).toBeDefined()
    })

    it('should respect custom timeout', async () => {
      try {
        await veloxa(getMockUrl('/api/slow'), {
          timeout: 500
        })
        expect.fail('Should have timed out')
      } catch (err) {
        const error = err as VeloxaError

        expect(error.message).toMatch(/timeout/i)
      }
    }, 10000)
  })

  describe('Method Option', () => {
    it('should default to GET when method not specified', async () => {
      const data = await veloxa(getMockUrl('/api/users'))

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should support all HTTP methods', async () => {
      // GET
      const getData = await veloxa(getMockUrl('/api/users'))
      expect(getData).toBeDefined()

      // POST
      const postData = await veloxa(getMockUrl('/api/users'), {
        method: 'POST',
        body: { name: 'Test' }
      })
      expect(postData).toHaveProperty('name', 'Test')

      // PUT
      const putData = await veloxa(getMockUrl('/api/users/1'), {
        method: 'PUT',
        body: { name: 'Updated' }
      })
      expect(putData).toHaveProperty('name', 'Updated')

      // PATCH
      const patchData = await veloxa(getMockUrl('/api/patch/1'), {
        method: 'PATCH',
        body: { name: 'Patched' }
      })
      expect(patchData).toHaveProperty('patched', true)

      // DELETE
      const deleteData = await veloxa(getMockUrl('/api/users/1'), {
        method: 'DELETE'
      })
      expect(deleteData).toHaveProperty('success', true)
    })
  })
})
