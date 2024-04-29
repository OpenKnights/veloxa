import {
  IDataObject,
  ITypeCheckes,
  TIsType,
  TMergeOptions,
  TTransGetParams
} from '../../types'

const typeCheckers: ITypeCheckes = {
  string: (target) => typeof target === 'string',
  object: (target) => target !== null && typeof target === 'object',
  empty: (target) =>
    !(target !== null && target !== '' && typeof target !== 'undefined')
}
// Determine the correctness of the target based on its type
export const isType: TIsType = (type, target) =>
  typeCheckers[type]?.(target) || false

// ueage function handle object
export const dealWithObject: (
  object: IDataObject,
  handler: Function
) => IDataObject = (object, handler) => {
  if (handler && typeof handler == 'function') return handler(object) || object
  return object
}

// Transform Parameters
export const transformGetParams: TTransGetParams = (params) => {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    const part = `${encodeURIComponent(propName)}=`
    if (isType('empty', value)) continue

    if (!isType('object', value)) {
      result += `${part + encodeURIComponent(value)}&`
      continue
    }

    for (const key of Object.keys(value)) {
      if (isType('empty', value)) continue

      const params = propName + `[${key}]`
      const subPart = `${encodeURIComponent(params)}=`

      result += `${subPart + encodeURIComponent(value[key])}&`
    }
  }
  return result.slice(0, -1)
}

// Merge request configuration options
export const mergeRequestOptions: TMergeOptions = (options, options2Merge) => {
  const { baseURL = '', headers = {}, ...argsOptions } = options
  const {
    url = '',
    headers: headers2Merge = {},
    ...argsOptions2Merge
  } = options2Merge

  return {
    input: `${baseURL}${url}`,
    init: {
      ...argsOptions,
      ...argsOptions2Merge,
      headers: {
        ...headers,
        ...headers2Merge
      }
    }
  }
}

// Request Error
export class RequestError extends Error {
  type: string
  constructor(text: any, type = 'RequestError') {
    super(text)
    this.name = 'RequestError'
    this.type = type
  }
}

// Response Error
export class ResponseError extends Error {
  type: string
  constructor(text: any, type = 'ResponseError') {
    super(text)
    this.name = 'ResponseError'
    this.type = type
  }
}
