// @flow strict-local
import * as effector from '@stateless-app/frontend/helpers/effector'

type State = {
  +fullscreen: boolean,
  +fullscreenUIHidden: boolean,
  +fullscreenUIOnHold: boolean,
}

const store = effector.createStore<State>({
  fullscreen: false,
  fullscreenUIHidden: false,
  fullscreenUIOnHold: false
})

export const FULLSCREEN: effector.Event<boolean> = effector.createReducer(store, (state, payload: boolean) => ({
  ...state,
  fullscreen: payload
}))

export const FULLSCREEN_UI_HIDDEN: effector.Event<boolean> = effector.createReducer(store, (state, payload: boolean) => ({
  ...state,
  fullscreenUIHidden: payload
}))
export const FULLSCREEN_UI_ON_HOLD: effector.Event<boolean> = effector.createReducer(store, (state, payload: boolean) => ({
  ...state,
  fullscreenUIOnHold: payload
}))

export function useState (): State {
  return effector.useStore(store)
}
