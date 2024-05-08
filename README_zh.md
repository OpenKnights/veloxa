# Veloxa

> Veloxa 是一个基于 Fetch API 的快速、原生的请求库。（ 简体中文 | [English](README_zh-CN.md) ）

## 安装

请确保您在 Node.js 环境下使用 npm 或其他包管理器安装此库。

```shell
npm install --save-dev veloxa
```

然后，利用现代的模块捆绑工具，如 Vite 或 Webpack，以模块化的语法引入此库。

```javascript
// 使用 ES Module
import { [[ModuleName]] } from 'veloxa'

// 使用 CommonJS
const { [[ModuleName]]  } = require('veloxa')
```

## 使用

```javascript
import request, { createVeloxa, veloxa } from 'veloxa'

const requestParams = {
  name: 'King-3',
  age: 18,
  ids: [36, 20, 3]
}

// 使用 request
let res1 = await request.get(
  'http://localhost:8080/testDelay',
  { name: 'king-3' },
  {
    timeout: 1200,
    errorHandler(error) {
      const { ok = false, ...err } = error
      return { ok, ...err }
    }
  }
)
console.log(`res1:`, res1)

// 使用 veloxa
const controller = new AbortController()
setTimeout(() => {
  controller.abort()
}, 800)
const res2 = await veloxa('http://localhost:8080/testGet', {
  params: requestParams,
  controller,
  interceptors: {
    requestInterceptor: (config) => {
      config.params.name = 'king3_get'
      return config
    }
  }
})
console.log(`res2:`, res2)

// 使用 createVeloxa
const veloxaReqeust = createVeloxa({
  baseURL: 'http://localhost:8080',
  timeout: 100000,
  // autojson default value true
  autojson: false,
  interceptors: {
    requestInterceptor(config) {
      config.headers['Authorization'] = 'Bearer kc3jn313d0193ksd1=120812d'

      return config
    },
    responseInterceptor(response) {
      const result = response.ok ? response.json() : response

      return response
    }
  }
})
const res2 = await veloxaReqeust.post('/testPost', requestParams, {
  interceptors: {
    responseInterceptor(response) {
      response.json = () =>
        response
          .clone()
          .json()
          .then((res) => {
            res.age = 20
            return res
          })

      return response
    }
  }
})
console.log(`res2:`, res2)

// 拦截器执行顺序:
// 1. InstanceInterceptors requestInterceptor
// 2. VeloxaInterceptors requestInterceptor
// 3. VeloxaInterceptors responseInterceptor
// 4. InstanceInterceptors responseInterceptor
```

## 方法

### createVeloxa

createVeloxa 函数根据所提供的配置参数，返回一个封装 Veloxa 函数特性的 request 类实例。

`function createVeloxa(config?: IVeloxaInit): VeloxaRequest`

```typescript
const request = createVeloxa({
  baseURL: 'http://localhost:3060',
  timeout: 100000,
  autojson: false
})

veloxaRequest.request('/test/request', { name: 'request' }, { timeout: 1000 })
veloxaRequest.get('/test/get', { name: 'get' }, { timeout: 1000 })
veloxaRequest.post('/test/post', { name: 'post' }, { timeout: 1000 })
veloxaRequest.delete('/test/delete', { name: 'delete' }, { timeout: 1000 })
veloxaRequest.patch('/test/patch', { name: 'patch' }, { timeout: 1000 })
veloxaRequest.put('/test/put', { name: 'put' }, { timeout: 1000 })
```

### veloxa

基于 Fetch 原生 API 封装的请求函数，符合 Fetch 基本规范，支持拦截器、请求超时、错误处理等功能。

`function veloxa(input: TVeloxaInput, init?: IVeloxaInit): Promise<any>`

```typescript
const controller = new AbortController()

setTimeout(() => {
  controller.abort()
}, 800)

let response = await veloxa('http://localhost:3060/testDelay'), {
  controller,
  autojson:false,
  errorHandler(error) {
    const { ok = false, ...err } = error
    return { ok, ...err }
  },
  requestInterceptor(config) {
    config.headers['Authorization'] = 'Bearer kc3jn313d0193ksd1=120812d'
    return config
  },
  responseInterceptor(response) {
    const result = response.ok ? response.json() : response
    return response
  }
})
```

## 类型

所有在 Veloxa 中定义的类型

```typescript
// veloxa 类型
type TVeloxaInput = RequestInfo | URL
interface IVeloxaInit extends RequestInit {
  timeout?: number
  autojson?: boolean
  interceptors?: IInterceptors
  controller?: AbortController
  url?: TVeloxaInput
  baseURL?: TVeloxaInput
  data?: any
  params?: any
  headers?: HeadersInit & IDataObject
  errorHandler?: (error: IDataObject | any) => any
}

// interceptor 类型
interface IInterceptors {
  requestInterceptor?: TRequestInterceptor
  responseInterceptor?: TResponseInterceptor
}
type TRequestInterceptor = (config: IVeloxaInit) => IVeloxaInit | void
type TResponseInterceptor = (response: Response) => Response | void

// other 类型
interface IDataObject {
  [key: string]: any
}

// Fetch API
declare class VeloxaRequest {
  private config
  constructor(config: IVeloxaInit)
  request(url: TVeloxaInput, config: IVeloxaInit): Promise<any>
  get(
    url: TVeloxaInput,
    params?: IDataObject,
    config?: IVeloxaInit
  ): Promise<any>
  post(
    url: TVeloxaInput,
    data?: IDataObject,
    config?: IVeloxaInit
  ): Promise<any>
  delete(
    url: TVeloxaInput,
    data?: IDataObject,
    config?: IVeloxaInit
  ): Promise<any>
  patch(
    url: TVeloxaInput,
    params?: IDataObject,
    config?: IVeloxaInit
  ): Promise<any>
  put(
    url: TVeloxaInput,
    params?: IDataObject,
    config?: IVeloxaInit
  ): Promise<any>
}

declare function createVeloxa(config?: IVeloxaInit): VeloxaRequest
declare const veloxaRequestInstance: VeloxaRequest
declare function veloxa(input: TVeloxaInput, init?: IVeloxaInit): Promise<any>

// veloxaError
declare class RequestError extends Error {
  type: string
  constructor(text: any, type?: string)
}
declare class ResponseError extends Error {
  type: string
  constructor(text: any, type?: string)
}
```
