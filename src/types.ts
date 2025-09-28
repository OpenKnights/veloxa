// --------------------------
// Veloxa API
// --------------------------

export type Veloxa = <T = any, R extends ResponseType = 'json'>(
  request: VeloxaRequest,
  options?: VeloxaOptions<R>
) => Promise<MappedResponseType<R, T>>

export type VeloxaRaw = <T = any, R extends ResponseType = 'json'>(
  request: VeloxaRequest,
  options?: VeloxaOptions<R>
) => Promise<VeloxaResponse<MappedResponseType<R, T>>>

// --------------------------
// Options
// --------------------------

export interface VeloxaOptions<R extends ResponseType = ResponseType, T = any>
  extends Omit<RequestInit, 'body'>,
    VeloxaHooks<T, R> {
  baseURL?: string

  body?: RequestInit['body'] | Record<string, any>

  ignoreResponseError?: boolean

  /**
   * @deprecated use query instead.
   */
  params?: Record<string, any>

  query?: Record<string, any>

  parseResponse?: (responseText: string) => any

  responseType?: R

  /** timeout in milliseconds */
  timeout?: number

  retry?: number | false

  /** Delay between retries in milliseconds. */
  retryDelay?: number | ((context: VeloxaContext<T, R>) => number)

  /** Default is [408, 409, 425, 429, 500, 502, 503, 504] */
  retryStatusCodes?: number[]
}

export interface ResolvedVeloxaOptions<
  R extends ResponseType = ResponseType,
  T = any
> extends VeloxaOptions<R, T> {
  headers: Headers
}

// --------------------------
// Hooks and Context
// --------------------------

export interface VeloxaContext<T = any, R extends ResponseType = ResponseType> {
  request: VeloxaRequest
  options: ResolvedVeloxaOptions<R>
  response?: VeloxaResponse<T>
  error?: Error
}

type MaybePromise<T> = T | Promise<T>
type MaybeArray<T> = T | T[]

export type VeloxaHook<C extends VeloxaContext = VeloxaContext> = (
  context: C
) => MaybePromise<void>

export interface VeloxaHooks<T = any, R extends ResponseType = ResponseType> {
  onRequest?: MaybeArray<VeloxaHook<VeloxaContext<T, R>>>
  onRequestError?: MaybeArray<
    VeloxaHook<VeloxaContext<T, R> & { error: Error }>
  >
  onResponse?: MaybeArray<
    VeloxaHook<VeloxaContext<T, R> & { response: VeloxaResponse<T> }>
  >
  onResponseError?: MaybeArray<
    VeloxaHook<VeloxaContext<T, R> & { response: VeloxaResponse<T> }>
  >
}

// --------------------------
// Response Types
// --------------------------

export interface ResponseMap {
  blob: Blob
  text: string
  arrayBuffer: ArrayBuffer
  stream: ReadableStream<Uint8Array>
}

export type ResponseType = keyof ResponseMap | 'json'

export type MappedResponseType<
  R extends ResponseType,
  JsonType = any
> = R extends keyof ResponseMap ? ResponseMap[R] : JsonType

export interface VeloxaResponse<T> extends Response {
  _data?: T
}

// --------------------------
// Error
// --------------------------

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

// --------------------------
// Other types
// --------------------------

export type Fetch = typeof globalThis.fetch

export type VeloxaRequest = RequestInfo

export interface SearchParameters {
  [key: string]: any
}
