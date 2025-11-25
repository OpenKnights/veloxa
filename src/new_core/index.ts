import { createVeloxa } from './veloxa'

export * from './error'

export type * from './types'
export { createVeloxa, veloxaRaw } from './veloxa'

export const veloxa = createVeloxa()
