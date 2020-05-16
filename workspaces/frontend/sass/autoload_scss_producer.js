const { productHeader, linesToString, nl } = require('@stateless-app/producers/helpers')

function produce (files) {
  const styles = (
    files
      .filter(path => /^views[/]([^/]+[/])*[\w-]+[.]scss$/.test(path))
  )

  return [{
    path: `${__dirname}/_autoload.scss`,
    content: linesToString([
      productHeader(false),
      nl(styles.map(p => `@import '~@stateless-app/frontend/${p}';`))
    ])
  }]
}

module.exports = produce
