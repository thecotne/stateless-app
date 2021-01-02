// @flow strict-local
type ProducedFile = {
  +content: string,
  +path: string,
}

function produce (files: $ReadOnlyArray<string>): $ReadOnlyArray<ProducedFile> {
  return array(function * () {
    yield file(`${__dirname}/_autoload.scss`, function * () {
      yield '// Auto Generated, Don\'t Modify Manually'
      for (const path of files) {
        if (/^views[/]([^/]+[/])*[\w-]+[.]scss$/.test(path)) {
          yield `@import '~@stateless-app/frontend/${path}';`
        }
      }
    })
  })
}

function array<T> (iterable: () => Iterable<T>): $ReadOnlyArray<T> {
  return Array.from(iterable())
}

function file (path: string, iterable: () => Iterable<string>): ProducedFile {
  return {
    path,
    content: array(iterable).join('\n')
  }
}

module.exports = produce
