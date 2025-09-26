import type {
  ResponseType,
  Veloxa,
  VeloxaContext,
  VeloxaOptions,
  VeloxaRaw,
  VeloxaRequest,
  VeloxaResponse
} from './types'

import { RETRY_STATUS_CODES } from './constants'
import {
  callHooks,
  isPayloadMethod,
  merge,
  resolveVeloxaOptions
} from './utils'
import { createVeloxaError } from './error'
import {
  methodToUpperCase,
  processRequestUrl,
  serializeBodyAndHeaders,
  serializeResponseBody
} from './handlers'

export const veloxaRaw: VeloxaRaw = async function veloxaRaw<
  T = any,
  R extends ResponseType = 'json'
>(request: VeloxaRequest, options: VeloxaOptions<R> = {}) {
  const context: VeloxaContext = {
    options: resolveVeloxaOptions<R, T>(request, options, Headers),
    request,
    response: undefined,
    error: undefined
  }

  // 请求类型大写转换
  methodToUpperCase(context)

  // 请求前拦截
  if (context.options.onRequest) {
    await callHooks(context, context.options.onRequest)
  }

  // 请求地址处理
  processRequestUrl(context)

  // 处理body和请求头
  serializeBodyAndHeaders(context)

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
  serializeResponseBody(context)

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

export const createVeloxa = (defaults: VeloxaOptions = {}): Veloxa => {
  const veloxa = async function veloxa(request, options) {
    const mergeOptions = merge({}, options, defaults)
    const r = await veloxaRaw(request, mergeOptions)
    return r._data
  } as Veloxa

  return veloxa
}

async function onError(context: VeloxaContext): Promise<VeloxaResponse<any>> {
  // Is Abort
  // If it is an active abort, it will not retry automatically.
  // https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names
  const isAbort =
    (context.error &&
      context.error.name === 'AbortError' &&
      !context.options.timeout) ||
    false
  // Retry
  if (context.options.retry !== false && !isAbort) {
    let retries
    if (typeof context.options.retry === 'number') {
      retries = context.options.retry
    } else {
      retries = isPayloadMethod(context.options.method) ? 0 : 1
    }

    const responseCode = (context.response && context.response.status) || 500
    if (
      retries > 0 &&
      (Array.isArray(context.options.retryStatusCodes)
        ? context.options.retryStatusCodes.includes(responseCode)
        : RETRY_STATUS_CODES.has(responseCode))
    ) {
      const retryDelay =
        typeof context.options.retryDelay === 'function'
          ? context.options.retryDelay(context)
          : context.options.retryDelay || 0
      if (retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
      // Timeout
      return veloxaRaw(context.request, {
        ...context.options,
        retry: retries - 1
      })
    }
  }

  // Throw normalized error
  const error = createVeloxaError(context)

  // Only available on V8 based runtimes (https://v8.dev/docs/stack-trace-api)
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, veloxaRaw)
  }
  throw error
}
