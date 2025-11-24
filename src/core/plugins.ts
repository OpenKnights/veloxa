import type { IDataObject, IVeloxaInit } from './types'

import { DATA_METHODS, PARAMS_METHODS } from './constants'
import { isType, transformGetParams } from './utils'

// Request Plugins
export function handlerParamsPlugin(config: IVeloxaInit) {
  if (!(PARAMS_METHODS.includes(config.method as string) && config.params))
    return

  config.url = `${config.url}?${transformGetParams(config.params)}`
  config.params = {}
  config.headers!['Content-Type'] = 'application/x-www-form-urlencoded'
}

export function handlerDataPlugin(config: IVeloxaInit) {
  if (!(DATA_METHODS.includes(config.method as string) && config.data)) return

  config.body = JSON.stringify(config.data)
  config.headers!['Content-Type'] = 'application/json'
  Reflect.deleteProperty(config, 'data')
}

export function initialConfigPlugin(config: IVeloxaInit) {
  if (!isType('object', config.headers)) config.headers = {}
  if (!isType('string', config.method)) config.method = 'GET'

  if (config.method) config.method = config.method.toUpperCase()
}

// Initialize Plugins's usage function.
const plugins = {
  use: (
    executes: Array<(params: IDataObject) => void>,
    params: IDataObject
  ) => {
    executes.forEach((fn) => fn(params))
  }
}

export default plugins
