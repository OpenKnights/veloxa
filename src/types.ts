export type Fetch = typeof globalThis.fetch

/**
 * Main Veloxa function type
 * Makes HTTP requests and returns parsed data
 */
export interface Veloxa {
  <T = any, R extends ResponseType = 'json'>(
    request: VeloxaRequest,
    options?: VeloxaOptions<R>
  ): Promise<MappedResponseType<R, T>>
  raw: <T = any, R extends ResponseType = 'json'>(
    request: VeloxaRequest,
    options?: VeloxaOptions<R>
  ) => Promise<VeloxaResponse<MappedResponseType<R, T>>>
  native: Fetch
  create: (defaults: VeloxaOptions) => Veloxa
}

/**
 * Request input type (URL string or Request object)
 */
export type VeloxaRequest = RequestInfo

/**
 * Extended Response interface with parsed data
 */
export interface VeloxaResponse<T> extends Response {
  _data?: T
}

/**
 * Request options interface
 * Extends standard RequestInit with Veloxa-specific features
 */
export interface VeloxaOptions<R extends ResponseType = ResponseType, T = any>
  extends Omit<RequestInit, 'body'>,
    VeloxaInterceptors<T, R> {
  /** Base URL to prepend to request URLs */
  baseURL?: string
  /** Request timeout in milliseconds */
  timeout?: number
  /** Request body (supports objects which will be auto-serialized) */
  body?: RequestInit['body'] | Record<string, any>
  /** Query parameters to append to URL */
  query?: Record<string, any>

  /** Expected response type for parsing */
  responseType?: R
  /** Custom response parser function */
  parseResponse?: (responseText: string) => any

  /** If true, don't throw errors for 4xx/5xx responses */
  ignoreResponseError?: boolean
}

/**
 * Resolved options with normalized headers
 */
export interface ResolvedVeloxaOptions<
  R extends ResponseType = ResponseType,
  T = any
> extends VeloxaOptions<R, T> {
  headers: Headers
}

/**
 * Request context passed through the request lifecycle
 * Contains request, options, response, and any errors
 */
export interface VeloxaContext<T = any, R extends ResponseType = ResponseType> {
  request: VeloxaRequest
  options: ResolvedVeloxaOptions<R>
  response?: VeloxaResponse<T>
  error?: Error
}

/**
 * Mapping of response types to their return values
 */
export interface ResponseMap {
  blob: Blob
  text: string
  stream: ReadableStream<Uint8Array>
}

/**
 * Supported response types
 */
export type ResponseType = keyof ResponseMap | 'json'

/**
 * Maps response type to TypeScript type
 * Returns JsonType for 'json', otherwise uses ResponseMap
 */
export type MappedResponseType<
  R extends ResponseType,
  JsonType = any
> = R extends keyof ResponseMap ? ResponseMap[R] : JsonType

/* Helper Types */

/**
 * Value that may or may not be wrapped in a Promise
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Value that may be a single item or an array
 */
export type MaybeArray<T> = T | T[]

/**
 * Processor function that modifies the context
 */
export type VeloxaProcessor<C extends VeloxaContext = VeloxaContext> = (
  context: C
) => MaybePromise<void>

/* Interceptor Types */

/**
 * Interceptor function for lifecycle hooks
 */
export type VeloxaInterceptor<C extends VeloxaContext = VeloxaContext> = (
  context: C
) => MaybePromise<void>

/**
 * Interceptors for different lifecycle stages
 */
export interface VeloxaInterceptors<
  T = any,
  R extends ResponseType = ResponseType
> {
  /** Called before the request is sent */
  onRequest?: MaybeArray<VeloxaInterceptor<VeloxaContext<T, R>>>
  /** Called when request fails (network error, timeout, etc.) */
  onRequestError?: MaybeArray<
    VeloxaInterceptor<VeloxaContext<T, R> & { error: Error }>
  >
  /** Called after successful response */
  onResponse?: MaybeArray<
    VeloxaInterceptor<VeloxaContext<T, R> & { response: VeloxaResponse<T> }>
  >
  /** Called when response status is 4xx or 5xx */
  onResponseError?: MaybeArray<
    VeloxaInterceptor<VeloxaContext<T, R> & { response: VeloxaResponse<T> }>
  >
}

/**
 * Veloxa error interface with request/response context
 */
export interface IVeloxaError<T = any> extends Error {
  request?: VeloxaRequest
  options?: VeloxaOptions
  response?: VeloxaResponse<T>
  data?: T
  status?: number
  statusText?: string
  statusCode?: number
  statusMessage?: string
}
