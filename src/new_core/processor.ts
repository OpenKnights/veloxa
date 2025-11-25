import destr from 'destr'
import { withBase, withQuery } from 'ufo'

import { NULL_BODY_RESPONSES } from './constants'
import {
  createProcessor,
  detectResponseType,
  isJSONSerializable,
  isPayloadMethod
} from './util'

// 请求类型大写转换
export const normalizeMethod = createProcessor((context) => {
  if (typeof context.options.method !== 'string') return

  const UpperMethod = context.options.method.toUpperCase()

  context.options.method = UpperMethod
})

// 请求地址处理
export const normalizeUrl = createProcessor((context) => {
  if (typeof context.request !== 'string') return

  if (context.options.baseURL) {
    context.request = withBase(context.request, context.options.baseURL)
  }

  if (context.options.query) {
    context.request = withQuery(context.request, context.options.query)
  }

  if (Reflect.get(context.options, 'query')) {
    Reflect.deleteProperty(context.options, 'query')
  }
})

// 处理body和请求头
export const preparePayload = createProcessor((context) => {
  if (
    !isPayloadMethod(context.options.method) ||
    !isJSONSerializable(context.options.body)
  ) {
    return
  }

  const contentType = context.options.headers.get('content-type')

  // 当body不是字符串时, 自动将其转换成JSON字符串
  if (typeof context.options.body !== 'string') {
    context.options.body =
      contentType === 'application/x-www-form-urlencoded'
        ? new URLSearchParams(
            context.options.body as Record<string, any>
          ).toString()
        : JSON.stringify(context.options.body)
  }

  // 设置 Content-Type 和 Accept 报头的默认值为 application/json
  context.options.headers = new Headers(context.options.headers || {})
  if (!contentType) {
    context.options.headers.set('content-type', 'application/json')
  }
  if (!context.options.headers.has('accept')) {
    context.options.headers.set('accept', 'application/json')
  }
})

// 解析响应值
export const parseResponse = createProcessor(async (context) => {
  if (!context.response) return

  const hasBody =
    (context.response.body || (context.response as any)._bodyInit) &&
    !NULL_BODY_RESPONSES.has(context.response.status) &&
    context.options.method !== 'HEAD'

  if (!hasBody) return

  const responseType =
    (context.options.parseResponse ? 'json' : context.options.responseType) ||
    detectResponseType(context.response.headers.get('content-type') || '')

  // We override the `.json()` method to parse the body more securely with `destr`
  switch (responseType) {
    case 'json': {
      const data = await context.response.text()
      const parseFunction = context.options.parseResponse || destr
      context.response._data = parseFunction(data)
      break
    }
    case 'stream': {
      context.response._data =
        context.response.body || (context.response as any)._bodyInit // (see refs above)
      break
    }
    default: {
      context.response._data = await (context.response as any)[responseType]()
    }
  }
})
