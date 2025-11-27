import destr from 'destr'
import { withBase, withQuery } from 'ufo'

import { NULL_BODY_RESPONSES } from './constants'
import {
  createProcessor,
  detectResponseType,
  isJSONSerializable,
  isPayloadMethod
} from './util'

/**
 * Normalize HTTP method to uppercase
 * Converts request method to uppercase for consistency
 */
export const normalizeMethod = createProcessor((context) => {
  if (typeof context.options.method !== 'string') return

  const UpperMethod = context.options.method.toUpperCase()

  context.options.method = UpperMethod
})

/**
 * Process and normalize request URL
 * - Applies baseURL if provided
 * - Appends query parameters
 * - Removes query from options after processing
 */
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

/**
 * Prepare request payload and headers
 * - Serializes body to JSON or URL-encoded format for payload methods
 * - Sets appropriate Content-Type and Accept headers
 */
export const preparePayload = createProcessor((context) => {
  if (
    !isPayloadMethod(context.options.method) ||
    !isJSONSerializable(context.options.body)
  ) {
    return
  }

  const contentType = context.options.headers.get('content-type')

  // Auto-convert body to JSON string when not already a string
  if (typeof context.options.body !== 'string') {
    context.options.body =
      contentType === 'application/x-www-form-urlencoded'
        ? new URLSearchParams(
            context.options.body as Record<string, any>
          ).toString()
        : JSON.stringify(context.options.body)
  }

  // Set default Content-Type and Accept headers to application/json
  context.options.headers = new Headers(context.options.headers || {})
  if (!contentType) {
    context.options.headers.set('content-type', 'application/json')
  }
  if (!context.options.headers.has('accept')) {
    context.options.headers.set('accept', 'application/json')
  }
})

/**
 * Parse response body based on content type
 * - Detects response type from Content-Type header
 * - Parses response using appropriate method (json, text, blob, stream)
 * - Uses secure JSON parsing with destr by default
 */
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
