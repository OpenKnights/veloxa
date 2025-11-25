import type { IVeloxaError, VeloxaContext } from './types'

// eslint-disable-next-line typescript/no-unsafe-declaration-merging
export class VeloxaError<T = any> extends Error implements IVeloxaError<T> {
  constructor(message: string, opts?: { cause: unknown }) {
    // https://v8.dev/features/error-cause
    super(message, opts)

    this.name = 'VeloxaError'

    // Polyfill cause for other runtimes
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause
    }
  }
}

// Augment `VeloxaError` type to include `IVeloxaError` properties
export interface VeloxaError<T = any> extends IVeloxaError<T> {}

export function createVeloxaError<T = any>(
  ctx: VeloxaContext<T>
): IVeloxaError<T> {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || ''

  const method =
    (ctx.request as Request)?.method || ctx.options?.method || 'GET'
  const url = (ctx.request as Request)?.url || String(ctx.request) || '/'
  const requestStr = `[${method}] ${JSON.stringify(url)}`

  const statusStr = ctx.response
    ? `${ctx.response.status} ${ctx.response.statusText}`
    : '<no response>'

  const message = `${requestStr}: ${statusStr}${
    errorMessage ? ` ${errorMessage}` : ''
  }`

  const veloxaError: VeloxaError<T> = new VeloxaError(
    message,
    ctx.error ? { cause: ctx.error } : undefined
  )

  for (const key of ['request', 'options', 'response'] as const) {
    Object.defineProperty(veloxaError, key, {
      get() {
        return ctx[key]
      }
    })
  }

  for (const [key, refKey] of [
    ['data', '_data'],
    ['status', 'status'],
    ['statusCode', 'status'],
    ['statusText', 'statusText'],
    ['statusMessage', 'statusText']
  ] as const) {
    Object.defineProperty(veloxaError, key, {
      get() {
        return ctx.response && ctx.response[refKey]
      }
    })
  }

  return veloxaError
}
