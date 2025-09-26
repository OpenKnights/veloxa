import type {
  ResolvedVeloxaOptions,
  ResponseType,
  VeloxaContext,
  VeloxaHook,
  VeloxaOptions,
  VeloxaRequest
} from './types'

import { PAYLOAD_METHODS, TEXT_TYPES } from './constants'

export { createDefu as createMerge, defu as merge } from 'defu'

export function isPayloadMethod(method = 'GET') {
  return PAYLOAD_METHODS.has(method.toUpperCase())
}

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
  if (value.buffer) {
    return false
  }
  // `FormData` and `URLSearchParams` should't have a `toJSON` method,
  // but Bun adds it, which is non-standard.
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false
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
  input: VeloxaOptions<R, T> | undefined,
  Headers: typeof globalThis.Headers
): ResolvedVeloxaOptions<R, T> {
  // Gen headers
  const headers = genHeaders(
    input?.headers ?? (request as Request)?.headers,
    Headers
  )

  return {
    ...input,
    headers
  }
}

function genHeaders(
  input: HeadersInit | undefined,
  Headers: typeof globalThis.Headers
): Headers {
  return new Headers(input)
}

export async function callHooks<C extends VeloxaContext = VeloxaContext>(
  context: C,
  hooks: VeloxaHook<C> | VeloxaHook<C>[] | undefined
): Promise<void> {
  if (!hooks) return

  if (Array.isArray(hooks)) {
    for (const hook of hooks) {
      await hook(context)
    }
  } else {
    await hooks(context)
  }
}
