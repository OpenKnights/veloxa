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
