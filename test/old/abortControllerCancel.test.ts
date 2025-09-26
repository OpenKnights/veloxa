import type { MethodOption, Server } from 'create-mock-server'
import { createMockServer } from 'create-mock-server'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { veloxa } from '../../src'

function delayer(time = 2000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({})
    }, time)
  })
}

describe('abortControllerCancel.test', () => {
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

  const prefix = (api: string) => `${server.url}${api}`

  it('Did manual request cancellation with AbortController succeed?', async () => {
    const controller = new AbortController()
    setTimeout(() => {
      controller.abort()
    }, 800)
    const response = await veloxa(prefix('/testDelay'), {
      controller,
      errorHandler(error) {
        const { ok = false, ...err } = error
        return { ok, ...err }
      }
    })

    expect(response.type).to.equal('AbortError')
  })
})
