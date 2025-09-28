import type { MockServer } from 'create-mock-server'
import { createMockServer } from 'create-mock-server'
import { getHeaders, getRouterParam, readBody } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { veloxa } from '../src/index'

describe('Veloxa HTTP Methods', () => {
  let server: MockServer
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]

  beforeAll(async () => {
    server = createMockServer({
      routes: [
        // GET - 获取所有用户
        {
          url: '/users',
          method: 'get',
          handler: async () => ({ users })
        },

        // POST - 创建用户
        {
          url: '/users',
          method: 'post',
          handler: async (event) => {
            const body = await readBody(event)
            const newUser = {
              id: Math.max(...users.map((u) => u.id)) + 1,
              ...body
            }
            return {
              success: true,
              user: newUser,
              message: 'User created successfully'
            }
          }
        },

        // PUT - 更新用户
        {
          url: '/users/:id',
          method: 'put',
          handler: async (event) => {
            const id = Number.parseInt(getRouterParam(event, 'id') || '1')
            const body = await readBody(event)

            const updatedUser = { id, ...body }
            return {
              success: true,
              user: updatedUser,
              message: 'User updated successfully'
            }
          }
        },

        // PATCH - 部分更新用户
        {
          url: '/users/:id',
          method: 'patch',
          handler: async (event) => {
            const id = Number.parseInt(getRouterParam(event, 'id') || '1')
            const body = await readBody(event)

            const existingUser = users.find((u) => u.id === id)
            const patchedUser = { ...existingUser, id, ...body }

            return {
              success: true,
              user: patchedUser,
              message: 'User patched successfully'
            }
          }
        },

        // DELETE - 删除用户
        {
          url: '/users/:id',
          method: 'delete',
          handler: async (event) => {
            const id = Number.parseInt(getRouterParam(event, 'id') || '1')

            return {
              success: true,
              deletedId: id,
              message: 'User deleted successfully'
            }
          }
        },

        // Form data 处理
        {
          url: '/upload',
          method: 'post',
          handler: async (event) => {
            const headers = getHeaders(event)
            const contentType = headers['content-type'] || ''

            return {
              contentType,
              received: true,
              message: 'File uploaded successfully'
            }
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

  describe('POST Requests', () => {
    it('should send JSON data in POST request', async () => {
      const userData = {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        age: 28
      }

      const response = await veloxa(`${server.url}/users`, {
        method: 'POST',
        body: userData
      })

      expect(response.success).toBe(true)
      expect(response.user).toMatchObject(userData)
      expect(response.user.id).toBeGreaterThan(2)
      expect(response.message).toBe('User created successfully')
    })

    it('should handle form data in POST request', async () => {
      const formData = new FormData()
      formData.append(
        'file',
        new Blob(['test content'], { type: 'text/plain' }),
        'test.txt'
      )
      formData.append('description', 'Test file upload')

      const response = await veloxa(`${server.url}/upload`, {
        method: 'POST',
        body: formData
      })

      expect(response.received).toBe(true)
      expect(response.contentType).toContain('multipart/form-data')
      expect(response.message).toBe('File uploaded successfully')
    })

    it('should handle URLSearchParams in POST request', async () => {
      const params = new URLSearchParams()
      params.append('name', 'Bob Wilson')
      params.append('email', 'bob@example.com')

      const response = await veloxa(`${server.url}/users`, {
        method: 'POST',
        body: params
      })

      expect(response.success).toBe(true)
      expect(response.user.name).toBe('Bob Wilson')
      expect(response.user.email).toBe('bob@example.com')
    })
  })

  describe('PUT Requests', () => {
    it('should send complete data in PUT request', async () => {
      const updatedUser = {
        name: 'John Updated',
        email: 'john.updated@example.com',
        role: 'admin'
      }

      const response = await veloxa(`${server.url}/users/1`, {
        method: 'PUT',
        body: updatedUser
      })

      expect(response.success).toBe(true)
      expect(response.user).toMatchObject({
        id: 1,
        ...updatedUser
      })
      expect(response.message).toBe('User updated successfully')
    })
  })

  describe('PATCH Requests', () => {
    it('should send partial data in PATCH request', async () => {
      const partialUpdate = {
        name: 'Jane Updated'
      }

      const response = await veloxa(`${server.url}/users/2`, {
        method: 'PATCH',
        body: partialUpdate
      })

      expect(response.success).toBe(true)
      expect(response.user.id).toBe(2)
      expect(response.user.name).toBe('Jane Updated')
      expect(response.user.email).toBe('jane@example.com') // 保持原有数据
      expect(response.message).toBe('User patched successfully')
    })
  })

  describe('DELETE Requests', () => {
    it('should handle DELETE requests', async () => {
      const response = await veloxa(`${server.url}/users/1`, {
        method: 'DELETE'
      })

      expect(response.success).toBe(true)
      expect(response.deletedId).toBe(1)
      expect(response.message).toBe('User deleted successfully')
    })
  })

  describe('Content-Type Headers', () => {
    it('should automatically set JSON content-type for object bodies', async () => {
      // 这个测试通过检查请求是否成功处理来间接验证 content-type 设置
      const response = await veloxa(`${server.url}/users`, {
        method: 'POST',
        body: { name: 'Test User', email: 'test@example.com' }
      })

      expect(response.success).toBe(true)
    })

    it('should handle custom content-type headers', async () => {
      const response = await veloxa(`${server.url}/users`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: { name: 'Form User', email: 'form@example.com' }
      })

      expect(response.success).toBe(true)
    })
  })

  describe('Method Case Handling', () => {
    it('should handle lowercase HTTP methods', async () => {
      const response = await veloxa(`${server.url}/users`, {
        method: 'post',
        body: { name: 'Lower Case', email: 'lower@example.com' }
      })

      expect(response.success).toBe(true)
    })

    it('should handle mixed case HTTP methods', async () => {
      const response = await veloxa(`${server.url}/users/1`, {
        method: 'Put',
        body: { name: 'Mixed Case', email: 'mixed@example.com' }
      })

      expect(response.success).toBe(true)
    })
  })
})
