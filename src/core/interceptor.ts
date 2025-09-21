import type {
  IDataObject,
  IVeloxaInit,
  TRequestInterceptor,
  TResponseInterceptor
} from './types'

import plugins, {
  handlerDataPlugin,
  handlerParamsPlugin,
  initialConfigPlugin
} from './plugins'
import { dealWithObject } from './utils'

export const processConfig = (
  config: IVeloxaInit,
  handler: TRequestInterceptor
): IVeloxaInit => dealWithObject(config, handler)
export const processResponse = (
  response: Response,
  handler: TResponseInterceptor
) => dealWithObject(response, handler) as Response

// initial shared interceptors.
const interceptors: IDataObject = {
  request: (config: IVeloxaInit, handler: TRequestInterceptor) => {
    //  Request interceptor plugins before usage.
    plugins.use([initialConfigPlugin], config)

    // Request interceptor handles configuration.
    config = processConfig(config, handler)

    //  Request interceptor plugins after usage.
    plugins.use([handlerParamsPlugin, handlerDataPlugin], config)
  },
  response: (response: Response, handler: TResponseInterceptor) => {
    // Response interceptor handles responses.
    response = processResponse(response, handler)
  }
}

// Initialize interceptor's usage function.
const interceptor = {
  use: (type: string, args: any[]) => interceptors[type](...args)
}

export default interceptor
