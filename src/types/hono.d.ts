// src/types/hono.d.ts
import 'hono'
import { RequestContext } from './context.types'
import { reqCtx } from '../constants/context'

declare module 'hono' {
  interface ContextVariableMap {
    [reqCtx]: RequestContext
  }
}
