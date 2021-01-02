const path = require('path')
const fs = require('fs').promises

async function applyAfterEmit (compiler, compilation, opts) {
  try {
    const unusedUnfiltered = (await walk(compiler.context))
      .map(file => path.join(compiler.context, file))
      .filter(file => !compilation.fileDependencies.has(file))

    const unusedFiltered = typeof opts.filter === 'function'
      ? unusedUnfiltered.filter(opts.filter)
      : unusedUnfiltered

    if (unusedFiltered.length !== 0) {
      throw new Error(`\nUnusedFilesWebpackPlugin found some unused files:\n${unusedFiltered.join('\n')}`)
    }
  } catch (error) {
    if (opts.failOnUnused && compilation.bail) throw error

    const errorsList = opts.failOnUnused
      ? compilation.errors
      : compilation.warnings

    errorsList.push(error)
  }
}

module.exports = function (opts) {
  return {
    apply (compiler) {
      compiler.hooks.afterEmit.tapAsync(
        { name: 'UnusedFilesWebpackPlugin' },
        (compilation, done) => applyAfterEmit(compiler, compilation, opts).then(done, done)
      )
    }
  }
}

async function walk (dirPath, base) {
  return array(scandir(dirPath, base))
}

async function * scandir (dirPath, base) {
  const basePath = base || dirPath

  for (const file of await fs.readdir(dirPath)) {
    const filePath = `${dirPath}/${file}`

    if ((await fs.stat(filePath)).isDirectory()) {
      yield * scandir(filePath, basePath)
    } else {
      yield path.relative(basePath, filePath)
    }
  }
}

async function array (iterable) {
  const arr = []

  for await (const entry of iterable) {
    arr.push(entry)
  }

  return arr
}
