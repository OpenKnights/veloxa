//#region XXX
//#endregion

//#region types.ts

export type VeloxaRequest = RequestInfo
export interface VeloxaResponse<T> extends Response {
  _data?: T
}

export interface VeloxaOptions<R extends ResponseType = ResponseType, T = any>
  extends Omit<RequestInit, 'body'>,
    VeloxaHooks<T, R> {
  baseURL?: string

  body?: RequestInit['body'] | Record<string, any>

  query?: Record<string, any>

  /** timeout in milliseconds */
  timeout?: number

  ignoreResponseError?: boolean

  parseResponse?: (responseText: string) => any

  responseType?: R

  // retry?: number | false
  // /** Delay between retries in milliseconds. */
  // retryDelay?: number | ((context: VeloxaContext<T, R>) => number)
  // /** Default is [408, 409, 425, 429, 500, 502, 503, 504] */
  // retryStatusCodes?: number[]
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

// 工具函数
type MaybePromise<T> = T | Promise<T>
type MaybeArray<T> = T | T[]

export type VeloxaHook<C extends VeloxaContext = VeloxaContext> = (
  context: C
) => MaybePromise<void>

// 请求生命周期
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

//#endregion

//#region valoxa.ts

async function veloxaRaw(request: VeloxaRequest, options: VeloxaOptions) {}

async function createVeloxa() {}

//#endregion
