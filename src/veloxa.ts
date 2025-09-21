import type { VeloxaContext, VeloxaRequest, VeloxaResponse } from './types'

import destr from 'destr'
import { withBase, withQuery } from 'ufo'
import { NULL_BODY_RESPONSES } from './constants'
import {
  callHooks,
  detectResponseType,
  isJSONSerializable,
  isPayloadMethod
} from './utils'

async function veloxa(request: VeloxaRequest, options: any = {}) {
  const context: VeloxaContext = {
    request,
    options,
    // options: resolveFetchOptions<R, T>(
    //   _request,
    //   _options,
    //   globalOptions.defaults as unknown as FetchOptions<R, T>,
    //   Headers
    // ),
    response: undefined,
    error: undefined
  }

  // 请求类型大写转换
  if (context.options.method) {
    context.options.method = context.options.method.toUpperCase()
  }

  // 请求前拦截
  if (context.options.onRequest) {
    await callHooks(context, context.options.onRequest)
  }

  // 请求地址处理
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

  // 设置请求超时
  let abortTimeout: NodeJS.Timeout | undefined
  if (!context.options.signal && context.options.timeout) {
    const controller = new AbortController()
    abortTimeout = setTimeout(() => {
      const error = new Error(
        '[TimeoutError]: The operation was aborted due to timeout'
      )
      error.name = 'TimeoutError'
      ;(error as any).code = 23 // DOMException.TIMEOUT_ERR
      controller.abort(error)
    }, context.options.timeout)
    context.options.signal = controller.signal
  }

  const onError: any = ''

  try {
    context.response = await fetch(
      context.request,
      context.options as RequestInit
    )
  } catch (error) {
    // 请求错误拦截
    context.error = error as Error
    if (context.options.onRequestError) {
      await callHooks(
        context as VeloxaContext & { error: Error },
        context.options.onRequestError
      )
    }
    return await onError(context)
  } finally {
    if (abortTimeout) {
      clearTimeout(abortTimeout)
    }
  }

  // 序列化请求响应值
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

  // 响应拦截
  if (context.options.onResponse) {
    await callHooks(
      context as VeloxaContext & { response: VeloxaResponse<any> },
      context.options.onResponse
    )
  }

  // 响应错误拦截
  if (
    !context.options.ignoreResponseError &&
    context.response.status >= 400 &&
    context.response.status < 600
  ) {
    if (context.options.onResponseError) {
      await callHooks(
        context as VeloxaContext & { response: VeloxaResponse<any> },
        context.options.onResponseError
      )
    }
    return await onError(context)
  }

  return context.response
}

export default veloxa
