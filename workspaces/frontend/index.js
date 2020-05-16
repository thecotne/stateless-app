// @flow strict-local
import Index from './views/Index'
import React from 'react'
import ReactDOM from 'react-dom'

if (document.body != null) {
  ReactDOM.render(
    React.createElement(Index),
    document.body.appendChild(document.createElement('main'))
  )
} else {
  console.error('This can\'t be happening!')
}
