// @flow strict-local
import * as React from 'react'

export function useDidMount (fn: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(fn, [])
}

type ResetableFormFieldProps<Value> = {
  +value: Value,
  +update: Value => mixed,
  +reset: void => mixed,
}

export function useField<T> (defaultValue: T): ResetableFormFieldProps<T> {
  const [value, update] = React.useState<T>(defaultValue)
  const reset = React.useCallback(() => void update(defaultValue), [defaultValue])

  return React.useMemo(() => ({ value, update, reset }), [reset, value])
}
