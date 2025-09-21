// utils types
export interface ITypeCheckes {
  [key: string]: (target: any) => boolean
}
export type TIsType = (type: string, target: any) => boolean

export type TTransGetParams = (params: IDataObject) => string

export type TMergeOptions = (
  options: IVeloxaInit,
  options2Merge: IVeloxaInit
) => IFetchOptions

// veloxa types
export type TVeloxaInput = RequestInfo | URL
export interface IVeloxaInit extends RequestInit {
  timeout?: number
  autojson?: boolean
  interceptors?: IInterceptors
  controller?: AbortController
  url?: TVeloxaInput
  baseURL?: TVeloxaInput
  data?: any
  params?: any
  headers?: HeadersInit & IDataObject
  errorHandler?: (error: IDataObject | any) => any
}

export interface IFetchOptions {
  input: TVeloxaInput
  init: IVeloxaInit
}

// interceptor types
export interface IInterceptors {
  requestInterceptor?: TRequestInterceptor
  responseInterceptor?: TResponseInterceptor
}
export type TRequestInterceptor = (config: IVeloxaInit) => IVeloxaInit | void
export type TResponseInterceptor = (response: Response) => Response | void

// other types
export interface IDataObject {
  [key: string]: any
}

// ============================================================================
// ================================ New Code ==================================
// ============================================================================

// --------------------------
// $fetch API
// --------------------------

export interface $Fetch {
  <T = any, R extends ResponseType = 'json'>(
    request: VeloxaRequest,
    options?: VeloxaOptions<R>
  ): Promise<MappedResponseType<R, T>>
  raw: <T = any, R extends ResponseType = 'json'>(
    request: VeloxaRequest,
    options?: VeloxaOptions<R>
  ) => Promise<VeloxaResponse<MappedResponseType<R, T>>>
  native: Fetch
  create: (
    defaults: VeloxaOptions,
    globalOptions?: CreateVeloxaOptions
  ) => $Fetch
}

// --------------------------
// Options
// --------------------------

export interface VeloxaOptions<R extends ResponseType = ResponseType, T = any>
  extends Omit<RequestInit, 'body'>,
    VeloxaHooks<T, R> {
  baseURL?: string

  body?: RequestInit['body'] | Record<string, any>

  ignoreResponseError?: boolean

  query?: Record<string, any>

  parseResponse?: (responseText: string) => any

  responseType?: R

  /**
   * Only supported in Node.js >= 18 using undici
   *
   * @see https://undici.nodejs.org/#/docs/api/Dispatcher
   */
  // dispatcher?: InstanceType<typeof import('undici').Dispatcher>

  /**
   * Only supported older Node.js versions using node-fetch-native polyfill.
   */
  agent?: unknown

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

export interface CreateVeloxaOptions {
  defaults?: VeloxaOptions
  fetch?: Fetch
  Headers?: typeof Headers
  AbortController?: typeof AbortController
}

export type GlobalOptions = Pick<
  VeloxaOptions,
  'timeout' | 'retry' | 'retryDelay'
>

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
// Other types
// --------------------------

export type Fetch = typeof globalThis.fetch

export type VeloxaRequest = RequestInfo

export interface SearchParameters {
  [key: string]: any
}
