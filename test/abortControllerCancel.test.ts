import { createTestServer } from 'devix-server'
import { veloxa } from '../src/index'
import { IDataObject } from '../types'

async function delayer(time = 2000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({})
    }, time)
  })
}

let server: IDataObject
const testDelayResponse = {
  code: 0,
  data: null,
  message: `延迟接口测试: /testDelay`
}
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

test('Did manual request cancellation with AbortController succeed?', async () => {
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, 800)
  let response = await veloxa(prefix('/testDelay'), {
    controller,
    errorHandler(error) {
      const { ok = false, ...err } = error
      return { ok, ...err }
    }
  })

  expect(response.type).toEqual('AbortError')
})
