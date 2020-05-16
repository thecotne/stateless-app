/* eslint-disable import/export */
// @flow strict-local
import { type Event, type Store, createApi as _createApi } from 'effector'

export * from 'effector'
export * from 'effector-react'

export function createApi<S, Api> (
  store: Store<S>,
  api: Api
  // $FlowFixMe
): $ObjMap<Api, <E>(h: (store: S, e: E) => S) => Event<E>> {
  // $FlowFixMe
  return _createApi(store, api)
}
