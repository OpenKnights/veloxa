# Veloxa

> Veloxa is a fast, native request library based on the Fetch API.（ English | [简体中文](README_zh-CN.md) ）

## Install

Please make sure you install this library using npm or another package manager in a Node.js environment.

```shell
npm install --save-dev veloxa
```

Then, utilize modern module bundling tools such as Vite or Webpack to import this library using modular syntax.

```javascript
// Using ES Module
import { [[ModuleName]] } from 'veloxa'

// Using CommonJS
const { [[ModuleName]]  } = require('veloxa')
```

## Usage

```javascript
import request, { createVeloxa, veloxa } from 'veloxa'

const requestParams = {
  name: 'King-3',
  age: 18,
  ids: [36, 20, 3]
}

// Using request
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

// Using veloxa
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

// Using createVeloxa
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

// interceptors execution order:
// 1. InstanceInterceptors requestInterceptor
// 2. VeloxaInterceptors requestInterceptor
// 3. VeloxaInterceptors responseInterceptor
// 4. InstanceInterceptors responseInterceptor
```

## API

### createVeloxa

The createVeloxa function returns an instance of the request class that encapsulates the features of the Veloxa function, based on the provided configuration parameters.

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

A request function encapsulated based on the native Fetch API, which adheres to the basic Fetch specifications and supports features like interceptors, request timeouts, and error handling.

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

## Type

All the types defined in Veloxa.

```typescript
// veloxa types
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

// interceptor types
interface IInterceptors {
  requestInterceptor?: TRequestInterceptor
  responseInterceptor?: TResponseInterceptor
}
type TRequestInterceptor = (config: IVeloxaInit) => IVeloxaInit | void
type TResponseInterceptor = (response: Response) => Response | void

// other types
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

// Error class
declare class RequestError extends Error {
  type: string
  constructor(text: any, type?: string)
}
declare class ResponseError extends Error {
  type: string
  constructor(text: any, type?: string)
}
```
