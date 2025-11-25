import type {
  ResolvedVeloxaOptions,
  ResponseType,
  VeloxaContext,
  VeloxaInterceptor,
  VeloxaInterceptors,
  VeloxaOptions,
  VeloxaProcessor,
  VeloxaRequest
} from './types'

import { PAYLOAD_METHODS, TEXT_TYPES } from './constants'

export { defu as merge } from 'defu'

// 是否是可以传参数的请求方式
export function isPayloadMethod(method = 'GET') {
  return PAYLOAD_METHODS.has(method.toUpperCase())
}

// 是否可序列化
export function isJSONSerializable(value: any) {
  if (value === undefined) {
    return false
  }
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean' || t === null) {
    return true
  }
  if (t !== 'object') {
    return false // bigint, function, symbol, undefined
  }
  if (Array.isArray(value)) {
    return true
  }
  return (
    (value.constructor && value.constructor.name === 'Object') ||
    typeof value.toJSON === 'function'
  )
}

const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i

// This provides reasonable defaults for the correct parser based on Content-Type header.
export function detectResponseType(_contentType = ''): ResponseType {
  if (!_contentType) {
    return 'json'
  }

  // Value might look like: `application/json; charset=utf-8`
  const contentType = _contentType.split(';').shift() || ''

  if (JSON_RE.test(contentType)) {
    return 'json'
  }

  // SSE
  // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#sending_events_from_the_server
  if (contentType === 'text/event-stream') {
    return 'stream'
  }

  if (TEXT_TYPES.has(contentType) || contentType.startsWith('text/')) {
    return 'text'
  }

  return 'blob'
}

export function resolveVeloxaOptions<
  R extends ResponseType = ResponseType,
  T = any
>(
  request: VeloxaRequest,
  options: VeloxaOptions<R, T> | undefined
): ResolvedVeloxaOptions<R, T> {
  const headers = new Headers(options?.headers ?? (request as Request)?.headers)

  return {
    ...options,
    headers
  }
}

export const createProcessor = (processor: VeloxaProcessor) => processor

export async function callInterceptor<C extends VeloxaContext = VeloxaContext>(
  type: keyof VeloxaInterceptors,
  context: C
): Promise<void> {
  if (!context.options[type]) return

  const hooks = context.options[type] as
    | VeloxaInterceptor<C>
    | VeloxaInterceptor<C>[]

  if (Array.isArray(hooks)) {
    for (const hook of hooks) {
      await hook(context)
    }
  } else {
    await hooks(context)
  }
}
