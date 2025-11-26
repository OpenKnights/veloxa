import { describe, it, expect } from 'vitest'
import { veloxa, createVeloxa, veloxaRaw } from '../src'
import { getMockUrl } from './setup'

describe('Basic Requests', () => {
  describe('GET requests', () => {
    it('should make a simple GET request', async () => {
      const data = await veloxa(getMockUrl('/api/users'))

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
      expect(data[0]).toHaveProperty('id', 1)
      expect(data[0]).toHaveProperty('name', 'Alice')
    })

    it('should make GET request with path parameters', async () => {
      const data = await veloxa(getMockUrl('/api/users/123'))

      expect(data).toBeDefined()
      expect(data).toHaveProperty('id', 123)
      expect(data).toHaveProperty('name', 'User 123')
      expect(data).toHaveProperty('email', 'user123@example.com')
    })

    it('should make GET request with query parameters', async () => {
      const data = await veloxa(getMockUrl('/api/query'), {
        query: {
          page: 1,
          limit: 10,
          search: 'test'
        }
      })

      expect(data).toBeDefined()
      expect(data.received).toEqual({
        page: '1',
        limit: '10',
        search: 'test'
      })
    })

    it('should respect baseURL option', async () => {
      const data = await veloxa('/api/users', {
        baseURL: getMockUrl()
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      const userData = {
        name: 'Charlie',
        email: 'charlie@example.com'
      }

      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'POST',
        body: userData
      })

      expect(data).toBeDefined()
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('name', 'Charlie')
      expect(data).toHaveProperty('email', 'charlie@example.com')
      expect(data).toHaveProperty('createdAt')
    })

    it('should auto-serialize body to JSON', async () => {
      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'POST',
        body: {
          name: 'David',
          email: 'david@example.com'
        }
      })

      expect(data.name).toBe('David')
      expect(data.email).toBe('david@example.com')
    })

    it('should handle form-urlencoded data', async () => {
      const data = await veloxa(getMockUrl('/api/form'), {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: {
          username: 'john',
          password: 'secret'
        }
      })

      expect(data.contentType).toContain('application/x-www-form-urlencoded')
      expect(JSON.stringify(data.received)).toBe(
        '{"username":"john","password":"secret"}'
      )
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      }

      const data = await veloxa(getMockUrl('/api/users/1'), {
        method: 'PUT',
        body: updateData
      })

      expect(data).toBeDefined()
      expect(data).toHaveProperty('id', 1)
      expect(data).toHaveProperty('name', 'Updated Name')
      expect(data).toHaveProperty('email', 'updated@example.com')
      expect(data).toHaveProperty('updatedAt')
    })
  })

  describe('PATCH requests', () => {
    it('should make PATCH request', async () => {
      const patchData = {
        name: 'Patched Name'
      }

      const data = await veloxa(getMockUrl('/api/patch/42'), {
        method: 'PATCH',
        body: patchData
      })

      expect(data).toBeDefined()
      expect(data).toHaveProperty('id', 42)
      expect(data).toHaveProperty('name', 'Patched Name')
      expect(data).toHaveProperty('patched', true)
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      const data = await veloxa(getMockUrl('/api/users/1'), {
        method: 'DELETE'
      })

      expect(data).toBeDefined()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('deletedId', 1)
    })
  })

  describe('Method normalization', () => {
    it('should normalize lowercase method to uppercase', async () => {
      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'get' as any
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should normalize mixed-case method to uppercase', async () => {
      const userData = { name: 'Test' }
      const data = await veloxa(getMockUrl('/api/users'), {
        method: 'PoSt' as any,
        body: userData
      })

      expect(data).toBeDefined()
      expect(data.name).toBe('Test')
    })
  })
})

describe('veloxaRaw - Full Response', () => {
  it('should return full response object', async () => {
    const response = await veloxaRaw(getMockUrl('/api/users'))

    expect(response).toBeDefined()
    expect(response).toHaveProperty('status', 200)
    expect(response).toHaveProperty('statusText')
    expect(response).toHaveProperty('headers')
    expect(response).toHaveProperty('_data')
    expect(Array.isArray(response._data)).toBe(true)
  })

  it('should include response metadata', async () => {
    const response = await veloxaRaw(getMockUrl('/api/users/1'))

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response._data).toBeDefined()
  })
})

describe('createVeloxa - Custom Instance', () => {
  it('should create instance with default baseURL', async () => {
    const api = createVeloxa({
      baseURL: getMockUrl()
    })

    const data = await api('/api/users')
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
  })

  it('should create instance with default headers', async () => {
    const api = createVeloxa({
      baseURL: getMockUrl(),
      headers: {
        'X-Custom-Header': 'test-value'
      }
    })

    const data = await api('/api/headers')
    expect(data.received['x-custom-header']).toBe('test-value')
  })

  it('should merge instance defaults with request options', async () => {
    const api = createVeloxa({
      baseURL: getMockUrl(),
      headers: {
        'X-Default': 'default-value'
      }
    })

    const data = await api('/api/headers', {
      headers: {
        'X-Request': 'request-value'
      }
    })

    expect(data.received['x-default']).toBe('default-value')
    expect(data.received['x-request']).toBe('request-value')
  })
})
