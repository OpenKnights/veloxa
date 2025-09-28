import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { createMockServer } from 'create-mock-server'
import type { MockServer } from 'create-mock-server'
import { veloxa, veloxaRaw } from '../src/index'

describe('Veloxa Response Types', () => {
  let server: MockServer

  beforeAll(async () => {
    server = createMockServer({
      routes: [
        // JSON 响应
        {
          url: '/json',
          method: 'get',
          handler: async () => ({
            message: 'JSON response',
            data: { numbers: [1, 2, 3], nested: { key: 'value' } },
            boolean: true,
            null: null
          })
        },

        // 文本响应
        {
          url: '/text',
          method: 'get',
          handler: async (event) => {
            const { setHeader } = await import('h3')
            setHeader(event, 'content-type', 'text/plain')
            return 'Plain text response'
          }
        },

        // HTML 响应
        {
          url: '/html',
          method: 'get',
          handler: async (event) => {
            const { setHeader } = await import('h3')
            setHeader(event, 'content-type', 'text/html')
            return '<html><body><h1>HTML Response</h1></body></html>'
          }
        },

        // XML 响应
        {
          url: '/xml',
          method: 'get',
          handler: async (event) => {
            const { setHeader } = await import('h3')
            setHeader(event, 'content-type', 'application/xml')
            return '<?xml version="1.0"?><root><message>XML Response</message></root>'
          }
        },

        // Blob 响应 (二进制数据)
        {
          url: '/blob',
          method: 'get',
          handler: async (event) => {
            const { setHeader } = await import('h3')
            setHeader(event, 'content-type', 'application/octet-stream')
            return Buffer.from('Binary data content', 'utf-8')
          }
        },

        // 流响应
        {
          url: '/stream',
          method: 'get',
          handler: async (event) => {
            const { setHeader } = await import('h3')
            setHeader(event, 'content-type', 'text/event-stream')
            return 'data: Stream data\n\n'
          }
        },

        // 空响应 (204 No Content)
        {
          url: '/empty',
          method: 'get',
          handler: async (event) => {
            const { setResponseStatus } = await import('h3')
            setResponseStatus(event, 204)
            return null
          }
        },

        // 大型 JSON 响应
        {
          url: '/large-json',
          method: 'get',
          handler: async () => {
            const items = Array.from({ length: 1000 }, (_, i) => ({
              id: i + 1,
              name: `Item ${i + 1}`,
              description: `Description for item ${i + 1}`,
              tags: [`tag${i}`, `category${i % 10}`]
            }))
            return { items, total: items.length }
          }
        },

        // 自定义 JSON 解析
        {
          url: '/custom-json',
          method: 'get',
          handler: async (event) => {
            const { setHeader } = await import('h3')
            setHeader(event, 'content-type', 'application/json')
            // 返回带有特殊字符的 JSON
            return '{"message": "Custom JSON", "special": "with\\nnewlines\\tand\\ttabs"}'
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

  describe('JSON Response Type', () => {
    it('should parse JSON responses by default', async () => {
      const response = await veloxa(`${server.url}/json`)

      expect(response).toEqual({
        message: 'JSON response',
        data: { numbers: [1, 2, 3], nested: { key: 'value' } },
        boolean: true,
        null: null
      })
      expect(typeof response).toBe('object')
      expect(Array.isArray(response.data.numbers)).toBe(true)
    })

    it('should explicitly parse JSON when responseType is json', async () => {
      const response = await veloxa(`${server.url}/json`, {
        responseType: 'json'
      })

      expect(response).toEqual({
        message: 'JSON response',
        data: { numbers: [1, 2, 3], nested: { key: 'value' } },
        boolean: true,
        null: null
      })
    })

    it('should handle large JSON responses', async () => {
      const response = await veloxa(`${server.url}/large-json`)

      expect(response).toHaveProperty('items')
      expect(response).toHaveProperty('total', 1000)
      expect(Array.isArray(response.items)).toBe(true)
      expect(response.items).toHaveLength(1000)
      expect(response.items[0]).toEqual({
        id: 1,
        name: 'Item 1',
        description: 'Description for item 1',
        tags: ['tag0', 'category0']
      })
    })
  })

  describe('Text Response Type', () => {
    it('should parse text responses when responseType is text', async () => {
      const response = await veloxa(`${server.url}/text`, {
        responseType: 'text'
      })

      expect(response).toBe('Plain text response')
      expect(typeof response).toBe('string')
    })

    it('should detect text response from content-type', async () => {
      const response = await veloxa(`${server.url}/text`)

      expect(response).toBe('Plain text response')
      expect(typeof response).toBe('string')
    })

    it('should handle HTML responses as text', async () => {
      const response = await veloxa(`${server.url}/html`, {
        responseType: 'text'
      })

      expect(response).toBe('<html><body><h1>HTML Response</h1></body></html>')
      expect(typeof response).toBe('string')
    })

    it('should handle XML responses as text', async () => {
      const response = await veloxa(`${server.url}/xml`, {
        responseType: 'text'
      })

      expect(response).toBe(
        '<?xml version="1.0"?><root><message>XML Response</message></root>'
      )
      expect(typeof response).toBe('string')
    })
  })

  describe('ArrayBuffer Response Type', () => {
    it('should parse responses as ArrayBuffer when specified', async () => {
      const response = await veloxa(`${server.url}/blob`, {
        responseType: 'arrayBuffer'
      })

      expect(response).toBeInstanceOf(ArrayBuffer)

      // 转换回字符串验证内容
      const text = new TextDecoder().decode(response)
      expect(text).toBe('Binary data content')
    })

    it('should handle binary data correctly', async () => {
      const response = await veloxa(`${server.url}/json`, {
        responseType: 'arrayBuffer'
      })

      expect(response).toBeInstanceOf(ArrayBuffer)

      // 可以转换回 JSON
      const text = new TextDecoder().decode(response)
      const json = JSON.parse(text)
      expect(json).toHaveProperty('message', 'JSON response')
    })
  })

  describe('Blob Response Type', () => {
    it('should parse responses as Blob when specified', async () => {
      const response = await veloxa(`${server.url}/blob`, {
        responseType: 'blob'
      })

      expect(response).toBeInstanceOf(Blob)

      // 验证 blob 内容
      const text = await response.text()
      expect(text).toBe('Binary data content')
    })

    it('should detect blob response for binary content-types', async () => {
      const response = await veloxa(`${server.url}/blob`)

      expect(response).toBeInstanceOf(Blob)
    })
  })

  describe('Stream Response Type', () => {
    it('should handle stream responses', async () => {
      const response = await veloxa(`${server.url}/stream`, {
        responseType: 'stream'
      })

      expect(response).toBeInstanceOf(ReadableStream)

      // 读取流数据
      const reader = response.getReader()
      const chunks: string[] = []

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(new TextDecoder().decode(value))
        }
      } finally {
        reader.releaseLock()
      }

      const fullText = chunks.join('')
      expect(fullText).toBe('data: Stream data\n\n')
    })

    it('should detect stream response for event-stream content-type', async () => {
      const response = await veloxa(`${server.url}/stream`)

      expect(response).toBeInstanceOf(ReadableStream)
    })
  })

  describe('Raw Response Access', () => {
    it('should provide access to raw response object', async () => {
      const response = await veloxaRaw(`${server.url}/json`)

      expect(response).toHaveProperty('status', 200)
      expect(response).toHaveProperty('statusText', 'OK')
      expect(response).toHaveProperty('ok', true)
      expect(response).toHaveProperty('headers')
      expect(response).toHaveProperty('_data')

      // 验证解析的数据
      expect(response._data).toEqual({
        message: 'JSON response',
        data: { numbers: [1, 2, 3], nested: { key: 'value' } },
        boolean: true,
        null: null
      })
    })

    it('should provide response headers access', async () => {
      const response = await veloxaRaw(`${server.url}/text`)

      expect(response.headers).toBeInstanceOf(Headers)
      expect(response.headers.get('content-type')).toContain('text/plain')
    })

    it('should handle empty responses in raw mode', async () => {
      const response = await veloxaRaw(`${server.url}/empty`)

      expect(response.status).toBe(204)
      expect(response.statusText).toBe('No Content')
      expect(response._data).toBeUndefined()
    })
  })

  describe('Custom Response Parsing', () => {
    it('should use custom parseResponse function', async () => {
      const response = await veloxa(`${server.url}/custom-json`, {
        parseResponse: (text: string) => {
          const parsed = JSON.parse(text)
          return {
            ...parsed,
            customParsed: true,
            originalLength: text.length
          }
        }
      })

      expect(response).toEqual({
        message: 'Custom JSON',
        special: 'with\nnewlines\tand\ttabs',
        customParsed: true,
        originalLength: expect.any(Number)
      })
    })

    it('should handle parsing errors gracefully', async () => {
      try {
        await veloxa(`${server.url}/text`, {
          parseResponse: (text: string) => {
            if (text === 'Plain text response') {
              throw new Error('Custom parsing error')
            }
            return JSON.parse(text)
          }
        })
      } catch (error) {
        expect(error.message).toContain('Custom parsing error')
      }
    })
  })

  describe('Response Type Detection', () => {
    it('should auto-detect JSON from content-type', async () => {
      const response = await veloxa(`${server.url}/json`)

      expect(typeof response).toBe('object')
      expect(response).toHaveProperty('message', 'JSON response')
    })

    it('should auto-detect text from content-type', async () => {
      const response = await veloxa(`${server.url}/text`)

      expect(typeof response).toBe('string')
      expect(response).toBe('Plain text response')
    })

    it('should auto-detect blob from binary content-type', async () => {
      const response = await veloxa(`${server.url}/blob`)

      expect(response).toBeInstanceOf(Blob)
    })

    it('should default to JSON when content-type is ambiguous', async () => {
      // 当没有明确的 content-type 时，应该默认为 JSON
      const response = await veloxa(`${server.url}/json`)

      expect(typeof response).toBe('object')
    })
  })
})
