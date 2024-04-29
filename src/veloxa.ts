import 'isomorphic-fetch'
import interceptor from './interceptor'
import { IVeloxaInit, TVeloxaInput } from '../types'
import { isType, RequestError } from './utils'

/**
 * Veloxa request function implemented based on the native Fetch API.
 *
 * @param {TVeloxaInput} input
 * @param {IVeloxaInit} init
 * @return {Promise<any>}
 */
async function veloxa(input: TVeloxaInput, init: IVeloxaInit = {}) {
  const {
    timeout = 0,
    autojson = true,
    interceptors: { requestInterceptor, responseInterceptor } = {},
    controller = new AbortController(),
    errorHandler,
    ...config
  } = init
  if (!isType('string', config.url)) config.url = input

  // request Interceptorvsc
  interceptor.use('request', [config, requestInterceptor])

  // fetch sendout
  let response: Response
  let timer = undefined
  try {
    // fetch timeout
    if (timeout > 0) {
      timer = setTimeout(() => {
        controller.abort()
      }, timeout)
    }

    // fetch await
    const { url, ...options } = config
    response = await fetch(url as TVeloxaInput, {
      ...options,
      signal: controller.signal
    })

    // fetch success cleartimeout
    if (timer) clearTimeout(timer)
  } catch (error: any) {
    // format error
    let err = new RequestError(error.message, error.name)

    // fetch aborted cleartimeout
    if (controller.signal.aborted) clearTimeout(timer)

    // format timed out error
    if (controller.signal.aborted && timer)
      err = new RequestError(
        'Request timed out, operation cancelled.',
        'TimeoutError'
      )

    // Handle run error
    if (errorHandler) {
      try {
        const data = errorHandler(err)
        return data
      } catch (e) {
        return Promise.reject(e)
      }
    } else {
      return Promise.reject(err)
    }
  }

  // response Interceptor
  interceptor.use('response', [response, responseInterceptor])

  // fetch result
  const isJson = response.ok && autojson && typeof response.json == 'function'
  const result = isJson ? response.json() : response
  return result
}

export default veloxa
