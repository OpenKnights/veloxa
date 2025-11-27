import type {
  MappedResponseType,
  ResponseType,
  Veloxa,
  VeloxaContext,
  VeloxaOptions,
  VeloxaRequest,
  VeloxaResponse
} from './types'

import { defu as merge } from 'defu'

import { createVeloxaError } from './error'
import {
  normalizeMethod,
  normalizeUrl,
  parseResponse,
  preparePayload
} from './processor'
import { callInterceptor, resolveVeloxaOptions } from './util'

/**
 * Raw Veloxa request function that returns the full response object
 * @param request - The request URL or Request object
 * @param options - Request options including headers, body, interceptors, etc.
 * @returns Promise resolving to the VeloxaResponse with typed data
 */
export const veloxaRaw: Veloxa['raw'] = async function $veloxaRaw<
  T = any,
  R extends ResponseType = 'json'
>(
  request: VeloxaRequest,
  options: VeloxaOptions<R> = {}
): Promise<VeloxaResponse<MappedResponseType<R, T>>> {
  const context: VeloxaContext = {
    options: resolveVeloxaOptions<R, T>(request, options),
    request,
    response: undefined,
    error: undefined
  }

  // Normalize request method to uppercase
  await normalizeMethod(context)

  // Execute onRequest interceptor
  await callInterceptor('onRequest', context)

  // Process and normalize request URL
  await normalizeUrl(context)

  // Prepare request body and headers
  await preparePayload(context)

  // Set up request timeout
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
    // Execute onRequestError interceptor
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

  // Parse response data
  await parseResponse(context)

  // Execute onResponse interceptor
  await callInterceptor(
    'onResponse',
    context as VeloxaContext & { response: VeloxaResponse<any> }
  )

  // Handle response errors (4xx, 5xx status codes)
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

/**
 * Create a Veloxa instance with default options
 * @param defaults - Default options to be merged with each request
 * @returns Veloxa function that returns parsed data directly
 */
export const createVeloxa = (defaults: VeloxaOptions = {}): Veloxa => {
  const veloxa = async function veloxa(request, options) {
    const mergeOptions = merge({}, options, defaults)
    const r = await veloxaRaw(request, mergeOptions)
    return r._data
  } as Veloxa

  veloxa.raw = veloxaRaw

  veloxa.native = fetch

  veloxa.create = (defaultOptions = {}) => createVeloxa(defaultOptions)

  return veloxa
}

/**
 * Error handler that creates and throws a normalized VeloxaError
 * @param context - The current request context
 * @returns Promise that always rejects with VeloxaError
 */
async function onError(context: VeloxaContext): Promise<VeloxaResponse<any>> {
  // Throw normalized error
  const error = createVeloxaError(context)

  // Only available on V8 based runtimes (https://v8.dev/docs/stack-trace-api)
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, veloxaRaw)
  }
  throw error
}
