import type {
  MappedResponseType,
  ResponseType,
  Veloxa,
  VeloxaContext,
  VeloxaOptions,
  VeloxaRequest,
  VeloxaResponse
} from './types'

import { createVeloxaError } from './error'
import {
  normalizeMethod,
  normalizeUrl,
  parseResponse,
  preparePayload
} from './processor'
import { callInterceptor, merge, resolveVeloxaOptions } from './util'

export async function veloxaRaw<T = any, R extends ResponseType = 'json'>(
  request: VeloxaRequest,
  options?: VeloxaOptions<R>
): Promise<VeloxaResponse<MappedResponseType<R, T>>> {
  const context: VeloxaContext = {
    options: resolveVeloxaOptions(request, options),
    request,
    response: undefined,
    error: undefined
  }

  // 请求类型大写转换
  await normalizeMethod(context)

  // 请求前拦截
  await callInterceptor('onRequest', context)

  // 请求地址处理
  await normalizeUrl(context)

  // 处理body和请求头
  await preparePayload(context)

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
    await callInterceptor(
      'onRequestError',
      context as VeloxaContext & { error: Error }
    )
    return await onError(context)
  } finally {
    if (abortTimeout) {
      clearTimeout(abortTimeout)
    }
  }

  // 序列化请求响应值
  await parseResponse(context)

  // 响应拦截
  await callInterceptor(
    'onResponse',
    context as VeloxaContext & { response: VeloxaResponse<any> }
  )

  // 响应错误拦截
  if (
    !context.options.ignoreResponseError &&
    context.response.status >= 400 &&
    context.response.status < 600
  ) {
    await callInterceptor(
      'onResponseError',
      context as VeloxaContext & { response: VeloxaResponse<any> }
    )
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
  // Throw normalized error
  const error = createVeloxaError(context)

  // Only available on V8 based runtimes (https://v8.dev/docs/stack-trace-api)
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, veloxaRaw)
  }
  throw error
}
