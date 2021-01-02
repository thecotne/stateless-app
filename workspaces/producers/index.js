// @flow
const fs = require('fs').promises
const path = require('path')
const { red, yellow, green, blue } = require('chalk')
const { Command, flags } = require('@oclif/command')
const chokidar = require('chokidar')
const babelRegister = require('@babel/register')
const babelConfig = require('@stateless-app/blessing/babelrc.js')

require('regenerator-runtime/runtime')

babelRegister(babelConfig)

const frontendJsDir = root('workspaces/frontend')

function abs (src/*: string */) {
  return path.resolve(__dirname, src)
}

function root (src/*: string */ = '') {
  return path.resolve(abs('../..'), src)
}

function isProducer (src/*: string */) {
  return /_producer\.js$/.test(src)
}

function require_producer (src/*: string */) {
  const modulePath = root(path.resolve(frontendJsDir, src))

  // $FlowIssue
  return require(modulePath)
}

async function walk (dirPath/*: string */, base/*: ?string */) {
  return array(scandir(dirPath, base))
}

async function * scandir (dirPath/*: string */, base/*: ?string */) {
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

async function array<T> (iterable: AsyncGenerator<T, void, empty>): Promise<$ReadOnlyArray<T>> {
  const arr: T[] = []

  for await (const entry of iterable) {
    arr.push(entry)
  }

  return arr
}

async function executeProducersOnFiles (files, check, watch) {
  let exitCode = 0

  const producers = files.filter(isProducer)

  for (const producerPath of producers) {
    const producer = require_producer(producerPath)
    const currentProducedFiles = producer(files)

    if (!watch) console.info(blue(`[PRODUCE] ${path.relative(root(), producerPath)}`))

    for (const file of currentProducedFiles) {
      const filePath = path.relative(root(), file.path)

      let content = ''

      if (!content) {
        try {
          content = (await fs.readFile(file.path)).toString()
        } catch (err) {}
      }

      if (file.content !== content) {
        if (check) {
          if (watch) console.info(blue(`[PRODUCE] ${path.relative(root(), producerPath)}`))
          console.info(red(`  [ERROR] ${filePath}`))
          exitCode = 1
        } else {
          if (watch) console.info(blue(`[PRODUCE] ${path.relative(root(), producerPath)}`))
          console.info(yellow(`  [FIXED] ${filePath}`))
          await fs.writeFile(file.path, file.content)
        }
      } else {
        if (!watch) console.info(green(`   [OKEY] ${filePath}`))
      }
    }
  }

  return exitCode
}

async function executeProducers (check, watch) {
  if (!watch) {
    return executeProducersOnFiles(await walk(frontendJsDir), check, watch)
  }

  await executeProducersOnFiles(await walk(frontendJsDir), check, watch)

  const watcher = chokidar.watch(frontendJsDir, {
    awaitWriteFinish: {
      stabilityThreshold: 75,
      pollInterval: 15
    },
    ignoreInitial: true
  })

  watcher.on('all', async (event, path) => {
    if (
      event === 'unlink' ||
      event === 'add' ||
      (event === 'change' && isProducer(path))
    ) {
      try {
        delete require.cache[require.resolve(path)]
      } catch (err) {}

      executeProducersOnFiles(await walk(frontendJsDir), check, watch)
    }
  })
}

class ProducersCliCommand extends Command {
  async run () {
    const { flags: { check, watch } } = this.parse(ProducersCliCommand)

    const exitCode = await executeProducers(check, watch)

    if (Number.isInteger(exitCode)) this.exit(exitCode)
  }
}

ProducersCliCommand.description = ''

ProducersCliCommand.flags = {
  help: flags.help(),
  check: flags.boolean({ default: false, description: 'Just check files' }),
  watch: flags.boolean({ default: false, description: 'Watch for changes' })
}

module.exports = ProducersCliCommand
