// @flow strict-local
export type Defered<T> = {|
  +promise: Promise<T>,
  +reject: (Error | void) => void,
  +resolve: T => void
|}

export function defered<T> (): Defered<T> {
  let resolveHandler, rejectHandler

  const promise = new Promise<T>((resolve, reject) => {
    resolveHandler = resolve
    rejectHandler = reject
  })

  if (!resolveHandler || !rejectHandler) {
    throw new Error('Fuck!2')
  }

  return {
    resolve: resolveHandler,
    reject: rejectHandler,
    promise
  }
}
