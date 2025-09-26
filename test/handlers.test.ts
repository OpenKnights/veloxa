import { createMockServer } from 'create-mock-server'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('handlers test', () => {
  let server: Server

  const routes: MethodOption[] = [
    {
      url: '/testDelay',
      method: 'get',
      handler: async (ctx, next) => {
        await delayer(1000)
        await next()

        ctx.body = {
          code: 0,
          data: null,
          message: `延迟接口测试: /testDelay`
        }
      }
    }
  ]

  beforeAll(async () => {
    server = await createMockServer({ routes, autoWatch: true })
  })

  afterAll(() => {
    server.close?.()
  })
})
