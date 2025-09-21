import type { IDataObject } from '../types'
import { createTestServer } from 'devix-server'
import { veloxa } from '../src/index'

function delayer(time = 2000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({})
    }, time)
  })
}

const testDelayResponse = {
  code: 0,
  data: null,
  message: `延迟接口测试: /testDelay`
}

let server: IDataObject
const routes = [
  {
    url: '/testDelay',
    method: 'get',
    handler: async (ctx: any, next: any) => {
      await delayer(1000)
      await next()

      ctx.body = testDelayResponse
    }
  }
]
beforeAll(async () => {
  server = await createTestServer({ routes })
})
afterAll(() => {
  server.close()
})

const prefix = (api: string) => `${server.url}${api}`

test('Will request auto-cancel on timeout?', async () => {
  // receive response before timeout
  const response = await veloxa(prefix('/testDelay'), {
    timeout: 800,
    errorHandler(error) {
      const { ok = false, ...err } = error
      return { ok, ...err }
    }
  })

  expect(response.type).toEqual('TimeoutError')
})

test('Will timeout be cancelled if request succeeds early?', async () => {
  // receive response before timeout
  const response = await veloxa(prefix('/testDelay'), {
    timeout: 1200,
    autojson: true,
    errorHandler(error) {
      const { ok = false, ...err } = error
      return { ok, ...err }
    }
  })

  const isCancelledTimeout = response.message === testDelayResponse.message

  expect(isCancelledTimeout).toBe(true)
})
