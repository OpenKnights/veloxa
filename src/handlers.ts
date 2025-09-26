import type { VeloxaContext, VeloxaResponse } from './types'

import { withBase, withQuery } from 'ufo'
import {
  detectResponseType,
  isJSONSerializable,
  isPayloadMethod
} from './utils'
import { NULL_BODY_RESPONSES } from './constants'
import destr from 'destr'

export function methodToUpperCase(context: VeloxaContext) {
  // 请求类型大写转换
  if (context.options.method) {
    const UpperMethod = context.options.method.toUpperCase()

    context.options.method = UpperMethod
  }
}

export function processRequestUrl(context: VeloxaContext) {
  if (typeof context.request === 'string') {
    if (context.options.baseURL) {
      context.request = withBase(context.request, context.options.baseURL)
    }

    if (context.options.query) {
      context.request = withQuery(context.request, context.options.query)
    }

    if (Reflect.get(context.options, 'query')) {
      Reflect.deleteProperty(context.options, 'query')
    }
  }
}

export function serializeBodyAndHeaders(context: VeloxaContext) {
  if (
    isPayloadMethod(context.options.method) &&
    isJSONSerializable(context.options.body)
  ) {
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
  }
}

interface ResponseContext extends VeloxaContext {
  response: VeloxaResponse<any>
}

// 序列化请求响应值
export async function serializeResponseBody(_context: VeloxaContext) {
  const context = _context as ResponseContext

  const hasBody =
    (context.response.body || (context.response as any)._bodyInit) &&
    !NULL_BODY_RESPONSES.has(context.response.status) &&
    context.options.method !== 'HEAD'
  if (hasBody) {
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
        context.response._data = await context.response[responseType]()
      }
    }
  }
}
