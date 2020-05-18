/* eslint-disable import/export */
// @flow strict-local
import { type Event, type Store } from 'effector'

export * from 'effector'
export * from 'effector-react'

// flowlint-next-line unclear-type:off
declare export function createApi<S, Api: any> (
  store: Store<S>,
  api: Api
): $ObjMap<Api, <E>(h: (store: S, e: E) => S) => Event<E>>
