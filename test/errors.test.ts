import { describe, it, expect } from 'vitest'
import { veloxa, veloxaRaw, VeloxaError } from '../src'
import { getMockUrl } from './setup'

describe('Error Handling', () => {
  describe('HTTP Error Status Codes', () => {
    it('should throw VeloxaError on 400 Bad Request', async () => {
      await expect(veloxa(getMockUrl('/api/error/400'))).rejects.toThrow(
        VeloxaError
      )
    })

    it('should include error details for 400', async () => {
      try {
        await veloxa(getMockUrl('/api/error/400'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error).toHaveProperty('status', 400)
        expect(error).toHaveProperty('statusCode', 400)
        expect(error).toHaveProperty('statusText', 'Bad Request')
        expect(error).toHaveProperty('data')
        expect(error.data).toHaveProperty('error', 'Bad Request')
        expect(error.data).toHaveProperty(
          'message',
          'Invalid request parameters'
        )
      }
    })

    it('should throw VeloxaError on 401 Unauthorized', async () => {
      try {
        await veloxa(getMockUrl('/api/error/401'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.status).toBe(401)
        expect(error.statusText).toBe('Unauthorized')
        expect(error.data.message).toBe('Authentication required')
      }
    })

    it('should throw VeloxaError on 404 Not Found', async () => {
      try {
        await veloxa(getMockUrl('/api/error/404'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.status).toBe(404)
        expect(error.statusText).toBe('Not Found')
        expect(error.data.message).toBe('Resource not found')
      }
    })

    it('should throw VeloxaError on 500 Internal Server Error', async () => {
      try {
        await veloxa(getMockUrl('/api/error/500'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.status).toBe(500)
        expect(error.statusText).toBe('Internal Server Error')
        expect(error.data.message).toBe('Something went wrong')
      }
    })
  })

  describe('VeloxaError Properties', () => {
    it('should include request in error', async () => {
      try {
        await veloxa(getMockUrl('/api/error/404'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error).toHaveProperty('request')
        expect(error.request).toBeDefined()
      }
    })

    it('should include options in error', async () => {
      try {
        await veloxa(getMockUrl('/api/error/404'), {
          method: 'GET',
          headers: { 'X-Test': 'value' }
        })
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error).toHaveProperty('options')
        expect(error.options).toBeDefined()
      }
    })

    it('should include response in error', async () => {
      try {
        await veloxa(getMockUrl('/api/error/400'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error).toHaveProperty('response')
        expect(error.response).toBeDefined()
        expect(error.response?.status).toBe(400)
      }
    })

    it('should have proper error message format', async () => {
      try {
        await veloxa(getMockUrl('/api/error/404'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.message).toMatch(/\[GET\]/)
        expect(error.message).toMatch(/404/)
        expect(error.message).toMatch(/Not Found/)
      }
    })
  })

  describe('Network Errors', () => {
    it('should throw on network failure', async () => {
      try {
        await veloxa('http://localhost:1/nonexistent')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(VeloxaError)
        expect(error).toHaveProperty('request')
      }
    })

    it('should handle invalid URL', async () => {
      await expect(veloxa('invalid-url')).rejects.toThrow()
    })
  })

  describe('Timeout Errors', () => {
    it('should timeout after specified duration', async () => {
      const startTime = Date.now()

      try {
        await veloxa(getMockUrl('/api/slow'), {
          timeout: 1000 // 1 second timeout
        })
        expect.fail('Should have thrown a timeout error')
      } catch (err) {
        const error = err as VeloxaError
        const duration = Date.now() - startTime

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error.message).toMatch(/timeout/i)
        expect(duration).toBeLessThan(2000)
        expect(duration).toBeGreaterThanOrEqual(1000)
      }
    }, 10000)

    it('should include timeout error cause', async () => {
      try {
        await veloxa(getMockUrl('/api/slow'), {
          timeout: 500
        })
        expect.fail('Should have thrown a timeout error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toBeInstanceOf(VeloxaError)
        expect(error).toHaveProperty('cause')
        expect(error.cause).toBeDefined()
      }
    }, 10000)
  })

  describe('ignoreResponseError Option', () => {
    it('should not throw when ignoreResponseError is true', async () => {
      const response = await veloxaRaw(getMockUrl('/api/error/404'), {
        ignoreResponseError: true
      })

      expect(response).toBeDefined()
      expect(response.status).toBe(404)
      expect(response._data).toBeDefined()
      expect(response._data.error).toBe('Not Found')
    })

    it('should return error data when ignoreResponseError is true', async () => {
      const response = await veloxaRaw(getMockUrl('/api/error/500'), {
        ignoreResponseError: true
      })

      expect(response.status).toBe(500)
      expect(response._data.error).toBe('Internal Server Error')
      expect(response._data.message).toBe('Something went wrong')
    })
  })

  describe('Error Name and Type', () => {
    it('should have correct error name', async () => {
      try {
        await veloxa(getMockUrl('/api/error/404'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error.name).toBe('VeloxaError')
      }
    })

    it('should be instanceof Error', async () => {
      try {
        await veloxa(getMockUrl('/api/error/404'))
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error).toBeInstanceOf(VeloxaError)
      }
    })
  })

  describe('Error Stack Trace', () => {
    it('should have stack trace', async () => {
      try {
        await veloxa(getMockUrl('/api/error/404'))
        expect.fail('Should have thrown an error')
      } catch (err) {
        const error = err as VeloxaError

        expect(error).toHaveProperty('stack')
        expect(error.stack).toBeDefined()
        expect(typeof error.stack).toBe('string')
      }
    })
  })
})
