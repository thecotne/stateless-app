const { readdir, stat } = require('fs').promises
const { relative } = require('path')

async function * walk (path, base) {
  base = base || path

  for (const file of await readdir(path)) {
    const filePath = `${path}/${file}`

    if ((await stat(filePath)).isDirectory()) {
      yield * walk(filePath, base)
    } else {
      yield relative(base, filePath)
    }
  }
}

async function walkArray (path, base) {
  return asyncGenToArray(walk(path, base))
}

async function asyncGenToArray (iterator) {
  const arr = []

  for await (const entry of iterator) {
    arr.push(entry)
  }

  return arr
}

function arrayEq (a, b) {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}

function productHeader (isFlow = true) {
  return nl([
    isFlow ? '// @flow strict-local' : [],
    '// Auto Generated, Don\'t Modify Manually'
  ])
}

// new line as needed
function nl (lines) {
  if (lines.length > 0) {
    if (lines[lines.length - 1] !== '') {
      return [...lines, '']
    } else {
      return [...lines.slice(0, lines.lastIndexOf('')), '']
    }
  } else {
    return lines
  }
}

function flatten (input) {
  const stack = [...input]
  const res = []

  while (stack.length) {
    const next = stack.pop()

    if (Array.isArray(next)) {
      stack.push(...next)
    } else {
      res.push(next)
    }
  }

  return res.reverse()
}

function linesToString (lines) {
  return nl(flatten(lines)).join('\n')
}

function optional (bool, val) {
  if (bool) {
    if (Array.isArray(val)) {
      return val
    } else {
      return [val]
    }
  } else {
    return []
  }
}

module.exports = {
  walk,
  walkArray,
  asyncGenToArray,
  arrayEq,
  productHeader,
  nl,
  flatten,
  linesToString,
  optional
}
