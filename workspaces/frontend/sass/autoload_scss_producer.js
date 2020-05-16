const { productHeader, linesToString, nl } = require('@fullmarks/producers/helpers')

function produce (files) {
  const styles = (
    files
      .filter(path => /^views[/]([^/]+[/])*[\w-]+[.]scss$/.test(path))
  )

  return [{
    path: `${__dirname}/_autoload.scss`,
    content: linesToString([
      productHeader(false),
      nl(styles.map(p => `@import '~@fullmarks/frontend/${p}';`))
    ])
  }]
}

module.exports = produce
