import * as App from '../App'
import * as React from 'react'

export default function Index (): React.ReactElement | null {
  const windowState = App.windowState.useState()

  return (
    <pre>{JSON.stringify(windowState, null, '  ')}</pre>
  )
}
