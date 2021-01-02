import * as effector from '@stateless-app/frontend/helpers/effector'

interface State {
  readonly height: number
  readonly width: number
}

export const store: effector.Store<State> = effector.createStore(getWindowSize())

export const RESIZE: effector.Event<State> = effector.createEvent()

store.on(RESIZE, (state, payload) => payload)

export const useState = (): State => effector.useStore(store)

window.addEventListener('resize', () => void RESIZE(getWindowSize()))

export function isMobile (state: State): boolean {
  const max = Math.max(state.width, state.height)
  const min = Math.min(state.width, state.height)

  return max < 1000 && min < 500
}

export function useMobile (): boolean {
  return isMobile(useState())
}

function getWindowSize (): State {
  return {
    height: window.innerHeight,
    width: window.innerWidth
  }
}
