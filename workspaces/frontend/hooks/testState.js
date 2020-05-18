// @flow strict-local
import { createApi, createStore, useStore } from '@stateless-app/frontend/helpers/effector'

type State = {|
  +fullscreen: boolean,
  +fullscreenUIHidden: boolean,
  +fullscreenUIOnHold: boolean,
|}

const store = createStore<State>({
  fullscreen: false,
  fullscreenUIHidden: false,
  fullscreenUIOnHold: false
})

export const actions = createApi(store, {
  FULLSCREEN: (state, payload: boolean) => {
    return {
      ...state,
      fullscreen: payload
    }
  },
  FULLSCREEN_UI_HIDDEN: (state, payload: boolean) => ({
    ...state,
    fullscreenUIHidden: payload
  }),
  FULLSCREEN_UI_ON_HOLD: (state, payload: boolean) => ({
    ...state,
    fullscreenUIOnHold: payload
  })
})

export const useState = () => useStore(store)
