const { readFile, writeFile } = require('fs').promises
const { resolve, relative } = require('path')
const { red, yellow, green, blue } = require('chalk')
const { Command, flags } = require('@oclif/command')
const chokidar = require('chokidar')
const { walkArray, arrayEq } = require('./helpers')

const abs = str => resolve(__dirname, str)
const root = (str = '') => resolve(abs('../..'), str)

const frontendJsDir = root('workspaces/frontend')

const isProducer = path => /_producer\.js$/.test(path)
const require_producer = path => require(root(resolve(frontendJsDir, path)))
const walk = async () => walkArray(frontendJsDir)

async function executeProducersOnFiles (files, producedFiles, check, watch) {
  let exitCode = 0

  const producers = files.filter(isProducer)

  for (const producerPath of producers) {
    const producer = require_producer(producerPath)
    const currentProducedFiles = producer(files)

    if (!watch) console.info(blue(`[PRODUCE] ${relative(root(), producerPath)}`))

    for (const file of currentProducedFiles) {
      const filePath = relative(root(), file.path)

      let content = ''

      if (watch) {
        content = producedFiles[filePath]
      }

      if (!content) {
        try {
          content = (await readFile(file.path)).toString()
        } catch (err) {}
      }

      if (file.content !== content) {
        if (watch) producedFiles[filePath] = content

        if (check) {
          if (watch) console.info(blue(`[PRODUCE] ${relative(root(), producerPath)}`))
          console.info(red(`  [ERROR] ${filePath}`))
          exitCode = 1
        } else {
          if (watch) console.info(blue(`[PRODUCE] ${relative(root(), producerPath)}`))
          console.info(yellow(`  [FIXED] ${filePath}`))
          await writeFile(file.path, file.content)
        }
      } else {
        if (!watch) console.info(green(`   [OKEY] ${filePath}`))
      }
    }
  }

  return exitCode
}

async function executeProducers (check, watch) {
  let files = await walk()
  const producedFiles = {}

  if (watch) {
    await executeProducersOnFiles(files, producedFiles, check, watch)

    const watcher = chokidar.watch(frontendJsDir, {
      awaitWriteFinish: true,
      interval: 300,
      ignoreInitial: true
    })

    watcher.on('all', async (event, path) => {
      let newFiles = await walk()

      if (event === 'unlink') {
        const unlinked = relative(frontendJsDir, path)

        newFiles = newFiles.filter(path => path !== unlinked)
      }

      if (!arrayEq(files, newFiles)) {
        files = newFiles

        executeProducersOnFiles(files, producedFiles, check, watch)
      }
    })
  } else {
    return executeProducersOnFiles(files, producedFiles, check, watch)
  }
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
