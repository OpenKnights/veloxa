//#region valoxa.ts

import { VeloxaOptions, VeloxaRequest } from "./types"

async function veloxaRaw(request: VeloxaRequest, options: VeloxaOptions) {
  const context: any = {
    options,
    request,
    response: undefined,
    error: undefined
  }

  // 请求类型大写转换
  if (context.options.method) {
    const UpperMethod = context.options.method.toUpperCase()

    context.options.method = UpperMethod
  }
}

async function createVeloxa() {}

//#endregion
