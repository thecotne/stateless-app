// @flow strict-local
import * as effector from 'effector'

export * from 'effector'
export * from 'effector-react'

export function createReducer<S, E> (store: effector.Store<S>, fn: (S, E) => S): effector.Event<E> {
  const action = effector.createEvent<E>()

  store.on(action, fn)

  return action
}

export function createAsyncAction<Params, Done, Fail> (handler: Params => Promise<Done> | Done): effector.Effect<Params, Done, Fail> {
  return effector.createEffect<Params, Done, Fail>({
    handler
  })
}
