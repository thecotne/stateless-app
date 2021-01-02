import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Index from './views/Index'

if (document.body != null) {
  ReactDOM.render(
    <Index />,
    document.body.appendChild(document.createElement('main'))
  )
} else {
  console.error('This can\'t be happening!')
}
