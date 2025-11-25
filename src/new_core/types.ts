export type Veloxa = <T = any, R extends ResponseType = 'json'>(
  request: VeloxaRequest,
  options?: VeloxaOptions<R>
) => Promise<MappedResponseType<R, T>>

export type VeloxaRequest = RequestInfo
export interface VeloxaResponse<T> extends Response {
  _data?: T
}

export interface VeloxaOptions<R extends ResponseType = ResponseType, T = any>
  extends Omit<RequestInit, 'body'>,
    VeloxaInterceptors<T, R> {
  baseURL?: string
  timeout?: number
  body?: RequestInit['body'] | Record<string, any>
  query?: Record<string, any>

  responseType?: R
  parseResponse?: (responseText: string) => any

  ignoreResponseError?: boolean
}

export interface ResolvedVeloxaOptions<
  R extends ResponseType = ResponseType,
  T = any
> extends VeloxaOptions<R, T> {
  headers: Headers
}

export interface VeloxaContext<T = any, R extends ResponseType = ResponseType> {
  request: VeloxaRequest
  options: ResolvedVeloxaOptions<R>
  response?: VeloxaResponse<T>
  error?: Error
}

export interface ResponseMap {
  blob: Blob
  text: string
  stream: ReadableStream<Uint8Array>
}

export type ResponseType = keyof ResponseMap | 'json'

export type MappedResponseType<
  R extends ResponseType,
  JsonType = any
> = R extends keyof ResponseMap ? ResponseMap[R] : JsonType

/* Helper */

export type MaybePromise<T> = T | Promise<T>
export type MaybeArray<T> = T | T[]

export type VeloxaProcessor<C extends VeloxaContext = VeloxaContext> = (
  context: C
) => MaybePromise<void>

/* Interceptor */

export type VeloxaInterceptor<C extends VeloxaContext = VeloxaContext> = (
  context: C
) => MaybePromise<void>

export interface VeloxaInterceptors<
  T = any,
  R extends ResponseType = ResponseType
> {
  onRequest?: MaybeArray<VeloxaInterceptor<VeloxaContext<T, R>>>
  onRequestError?: MaybeArray<
    VeloxaInterceptor<VeloxaContext<T, R> & { error: Error }>
  >
  onResponse?: MaybeArray<
    VeloxaInterceptor<VeloxaContext<T, R> & { response: VeloxaResponse<T> }>
  >
  onResponseError?: MaybeArray<
    VeloxaInterceptor<VeloxaContext<T, R> & { response: VeloxaResponse<T> }>
  >
}

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
