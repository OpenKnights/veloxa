import type { IDataObject } from '../types'
import { createTestServer } from 'mock-server'
import { createVeloxa, veloxa } from '../../src'

// other utils
function getQueryArray(keyName: string, query: IDataObject) {
  return Object.keys(query)
    .filter((key) => key.startsWith(`${keyName}[`))
    .map((key) => query[key])
}

// Config Server
let server: IDataObject
const testGetResponse = {
  code: 0,
  data: null,
  message: `POST 接口测试: /testGet`
}
const testPostResponse = {
  code: 0,
  data: null,
  message: `POST 接口测试: /testPost`
}
const routes = [
  {
    url: '/testPost',
    method: 'post',
    handler: (ctx: any) => {
      ctx.body = { ...testPostResponse, data: ctx.request.body }
    }
  },
  {
    url: '/testGet',
    method: 'get',
    handler: (ctx: any) => {
      const { name, age } = ctx.query
      const ids = getQueryArray('ids', ctx.query).map((i) =>
        Number.parseFloat(i)
      )

      ctx.body = {
        ...testGetResponse,
        data: {
          name,
          age: Number.parseFloat(age),
          ids
        }
      }
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

test(`Is Veloxa's default interceptor handling requests correctly?`, async () => {
  const requestParams = {
    name: 'King-3',
    age: 18,
    ids: [36, 20, 3]
  }

  const getTesult = await veloxa(prefix('/testGet'), {
    params: requestParams,
    interceptors: {
      requestInterceptor: (config) => {
        config.params.name = 'king3_get'

        return config
      }
    }
  })

  const postTesult = await veloxa(prefix('/testPost'), {
    data: requestParams,
    method: 'POST',
    interceptors: {
      requestInterceptor: (config) => {
        config.data.name = 'king3_post'

        return config
      }
    }
  })

  const isHandleParams = getTesult.data.name === 'king3_get'
  const isHandleData = postTesult.data.name === 'king3_post'

  expect(isHandleParams).toBe(true)
  expect(isHandleData).toBe(true)
})

test(`Is Veloxa's custom interceptor handling requests correctly?`, async () => {
  // init request
  const request = createVeloxa({
    baseURL: server.url,
    autojson: true,
    interceptors: {
      requestInterceptor(config) {
        config.data!.isInstanceRequestInterceptor = true

        return config
      },
      responseInterceptor(response) {
        ;(response as any).data.isInstanceResponseInterceptor = true

        return response
      }
    }
  })

  const requestParams = {
    name: 'King-3',
    age: 18
  }

  const result = await request.post('/testPost', requestParams, {
    interceptors: {
      requestInterceptor(config) {
        config.data!.isOnceRequestInterceptor = true

        return config
      },
      responseInterceptor(response) {
        response.json = () =>
          response
            .clone()
            .json()
            .then((res) => {
              res.data.isOnceResponseInterceptor = true
              return res
            })

        return response
      }
    }
  })

  expect(result.data.isInstanceRequestInterceptor).toBe(true)
  expect(result.data.isInstanceResponseInterceptor).toBe(true)
  expect(result.data.isOnceRequestInterceptor).toBe(true)
  expect(result.data.isOnceResponseInterceptor).toBe(true)
})
