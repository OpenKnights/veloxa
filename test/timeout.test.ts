import { createTestServer } from 'devix-server'
import { veloxa } from '../src/index'
import { IDataObject } from '../types'
import { testDelayResponseSuccess } from './serverTestOptions'

async function delayer(time = 2000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({})
    }, time)
  })
}

let server: IDataObject
const routes = [
  {
    url: '/testDelay',
    method: 'get',
    handler: async (ctx: any, next: any) => {
      await delayer(1000)
      await next()

      ctx.body = testDelayResponseSuccess
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
  let response = await veloxa(prefix('/testDelay'), {
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
  let response = await veloxa(prefix('/testDelay'), {
    timeout: 1200,
    autojson: true,
    errorHandler(error) {
      const { ok = false, ...err } = error
      return { ok, ...err }
    }
  })

  const isCancelledTimeout =
    response.message === testDelayResponseSuccess.message

  expect(isCancelledTimeout).toBe(true)
})
