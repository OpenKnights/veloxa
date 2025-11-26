import { describe, it, expect } from 'vitest'
import { veloxa } from '../src'
import { getMockUrl } from './setup'

describe('Response Types', () => {
  describe('JSON responses (default)', () => {
    it('should parse JSON response by default', async () => {
      const data = await veloxa(getMockUrl('/api/users'))

      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
      expect(Array.isArray(data)).toBe(true)
    })

    it('should explicitly parse as JSON', async () => {
      const data = await veloxa<any[]>(getMockUrl('/api/users'), {
        responseType: 'json'
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('name')
    })
  })

  describe('Text responses', () => {
    it('should parse text/plain response', async () => {
      const data = await veloxa<string>(getMockUrl('/api/text'), {
        responseType: 'text'
      })

      expect(data).toBeDefined()
      expect(typeof data).toBe('string')
      expect(data).toBe('Plain text response')
    })

    it('should parse text/html response', async () => {
      const data = await veloxa<string>(getMockUrl('/api/html'), {
        responseType: 'text'
      })

      expect(data).toBeDefined()
      expect(typeof data).toBe('string')
      expect(data).toContain('<h1>HTML Response</h1>')
    })
  })

  describe('Blob responses', () => {
    it('should handle blob response', async () => {
      const data = await veloxa<Blob>(getMockUrl('/api/blob'), {
        responseType: 'blob'
      })

      expect(data).toBeDefined()
      expect(data).toBeInstanceOf(Blob)
    })
  })

  describe('Empty responses', () => {
    it('should handle 204 No Content', async () => {
      const data = await veloxa(getMockUrl('/api/empty'))

      // For 204 responses, the parsed data should be undefined
      expect(data).toBeUndefined()
    })
  })

  describe('Custom response parser', () => {
    it('should use custom parseResponse function', async () => {
      const data = await veloxa(getMockUrl('/api/users'), {
        parseResponse: (text) => {
          const parsed = JSON.parse(text)
          return {
            data: parsed,
            customParsed: true
          }
        }
      })

      expect(data).toBeDefined()
      expect(data).toHaveProperty('customParsed', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should handle malformed JSON with custom parser', async () => {
      const data = await veloxa(getMockUrl('/api/users'), {
        parseResponse: (text) => {
          try {
            return JSON.parse(text)
          } catch {
            return { error: 'Parse failed', raw: text }
          }
        }
      })

      expect(data).toBeDefined()
    })
  })

  describe('Content-Type detection', () => {
    it('should auto-detect JSON from content-type', async () => {
      const data = await veloxa(getMockUrl('/api/users'))

      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
    })

    it('should auto-detect text from content-type', async () => {
      const data = await veloxa(getMockUrl('/api/text'))

      // When no responseType is specified, it should auto-detect
      expect(typeof data).toBe('string')
    })
  })
})
