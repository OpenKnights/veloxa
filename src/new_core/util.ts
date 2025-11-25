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

/**
 * Check if the HTTP method supports payload/body
 * @param method - HTTP method (default: 'GET')
 * @returns true if the method supports payload (PATCH, POST, PUT, DELETE)
 */
export function isPayloadMethod(method = 'GET') {
  return PAYLOAD_METHODS.has(method.toUpperCase())
}

/**
 * Check if a value can be serialized to JSON
 * @param value - Value to check
 * @returns true if the value is JSON serializable
 */
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

/**
 * Detect response type based on Content-Type header
 * Provides reasonable defaults for the correct parser
 * @param _contentType - Content-Type header value
 * @returns The detected response type (json, text, stream, or blob)
 */
export function detectResponseType(_contentType = ''): ResponseType {
  if (!_contentType) {
    return 'json'
  }

  // Value might look like: `application/json; charset=utf-8`
  const contentType = _contentType.split(';').shift() || ''

  if (JSON_RE.test(contentType)) {
    return 'json'
  }

  // SSE (Server-Sent Events)
  // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#sending_events_from_the_server
  if (contentType === 'text/event-stream') {
    return 'stream'
  }

  if (TEXT_TYPES.has(contentType) || contentType.startsWith('text/')) {
    return 'text'
  }

  return 'blob'
}

/**
 * Resolve and normalize Veloxa options
 * @param request - The request URL or Request object
 * @param options - User-provided request options
 * @returns Resolved options with normalized headers
 */
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

/**
 * Create a processor function
 * @param processor - The processor function
 * @returns The same processor function (identity function for type safety)
 */
export const createProcessor = (processor: VeloxaProcessor) => processor

/**
 * Call interceptor hooks for a specific lifecycle stage
 * @param type - The interceptor type (onRequest, onRequestError, onResponse, onResponseError)
 * @param context - The current request context
 */
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
