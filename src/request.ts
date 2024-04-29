import veloxa from './veloxa'
import { mergeRequestOptions } from './utils'
import { processConfig, processResponse } from './interceptor'
import { IDataObject, IVeloxaInit, TVeloxaInput } from '../types'

/** Fetch API request class implemented based on Veloxa */
class VeloxaRequest {
  private config

  /**
   * Creates an instance of VeloxaRequest.
   * @param {IVeloxaInit} config
   * @memberof VeloxaRequest
   */
  constructor(config: IVeloxaInit) {
    this.config = config
  }

  /**
   * Request method based on Veloxa
   *
   * @param {TVeloxaInput} url
   * @param {IVeloxaInit} config
   * @return {Promise<any>}
   */
  request(url: TVeloxaInput, config: IVeloxaInit): Promise<any> {
    // eslint-disable-next-line
    let { interceptors, errorHandler, ...options } = this.config

    // Merge configurations
    let mergeOptions = mergeRequestOptions(options, { ...config, url })
    const { input } = mergeOptions
    let { init } = mergeOptions

    // Interception handling for a single request
    if (interceptors?.requestInterceptor) {
      let configs = { ...init, url: input }
      init = processConfig(configs, interceptors.requestInterceptor) || configs
    }

    // Return Promise
    let { url: veloxaInput, ...veloxaInit } = init
    return new Promise((resolve, reject) => {
      veloxa(veloxaInput || input, veloxaInit)
        .then((res) => {
          // Interception handling for a single response
          if (interceptors?.responseInterceptor) {
            res = processResponse(res, interceptors.responseInterceptor)
          }
          resolve(res)
        })
        .catch((err) => {
          if (errorHandler) {
            try {
              const data = errorHandler(err)
              resolve(data)
            } catch (e) {
              reject(e)
            }
          } else {
            reject(err)
          }
        })
    })
  }

  /**
   *  The GET form of the request method
   *
   * @param {TVeloxaInput} url
   * @param {IDataObject} params
   * @param {IVeloxaInit} config
   * @return {Promise<any>}
   */
  get(url: TVeloxaInput, params?: IDataObject, config: IVeloxaInit = {}) {
    return this.request(url, {
      ...config,
      params,
      method: 'GET'
    })
  }

  /**
   *  The POST form of the request method
   *
   * @param {TVeloxaInput} url
   * @param {IDataObject} data
   * @param {IVeloxaInit} config
   * @return {Promise<any>}
   */
  post(url: TVeloxaInput, data?: IDataObject, config: IVeloxaInit = {}) {
    return this.request(url, {
      ...config,
      data,
      method: 'POST'
    })
  }

  /**
   *  The DELETE form of the request method
   *
   * @param {TVeloxaInput} url
   * @param {IDataObject} data
   * @param {IVeloxaInit} config
   * @return {Promise<any>}
   */
  delete(url: TVeloxaInput, data?: IDataObject, config: IVeloxaInit = {}) {
    return this.request(url, {
      ...config,
      data,
      method: 'DELETE'
    })
  }

  /**
   *  The PATCH form of the request method
   *
   * @param {TVeloxaInput} url
   * @param {IDataObject} params
   * @param {IVeloxaInit} config
   * @return {Promise<any>}
   */
  patch(url: TVeloxaInput, params?: IDataObject, config: IVeloxaInit = {}) {
    return this.request(url, {
      ...config,
      params,
      method: 'PATCH'
    })
  }

  /**
   *  The PUT form of the request method
   *
   * @param {TVeloxaInput} url
   * @param {IDataObject} params
   * @param {IVeloxaInit} config
   * @return {Promise<any>}
   */
  put(url: TVeloxaInput, params?: IDataObject, config: IVeloxaInit = {}) {
    return this.request(url, {
      ...config,
      params,
      method: 'PUT'
    })
  }
}

/**
 *  Pass configuration and return an instance of the VeloxaRequest class.
 *
 * @param {IVeloxaInit} config
 * @return {VeloxaRequest}
 */
export function createVeloxa(config: IVeloxaInit = {}): VeloxaRequest {
  return new VeloxaRequest(config)
}

const veloxaRequestInstance = createVeloxa({})
export default veloxaRequestInstance
