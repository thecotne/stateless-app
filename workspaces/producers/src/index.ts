import { Command, flags } from '@oclif/command'
import { blue, green, red, yellow } from 'chalk'
import { promises as fs } from 'fs'
import path = require('path')
import chokidar = require('chokidar')

const frontendJsDir = root('workspaces/frontend')

function abs (src: string): string {
  return path.resolve(__dirname, src)
}

function root (src: string = ''): string {
  return path.resolve(abs('../../..'), src)
}

function isProducer (src: string): boolean {
  return /_producer\.ts$/.test(src)
}

interface ProducedFile {
  readonly content: string
  readonly path: string
}

type Producer = (files: string[]) => readonly ProducedFile[]

function requireProducer (src: string): Producer {
  const modulePath = root(path.resolve(frontendJsDir, src))

  return require(modulePath)
}

async function walk (dirPath: string, base?: string): Promise<string[]> {
  return await array(scandir(dirPath, base))
}

async function * scandir (dirPath: string, base?: string): AsyncIterable<string> {
  const basePath = base ?? dirPath

  for (const file of await fs.readdir(dirPath)) {
    const filePath = `${dirPath}/${file}`

    if ((await fs.stat(filePath)).isDirectory()) {
      yield * scandir(filePath, basePath)
    } else {
      yield path.relative(basePath, filePath)
    }
  }
}

async function array<T> (iterable: AsyncIterable<T>): Promise<T[]> {
  const arr = []

  for await (const entry of iterable) {
    arr.push(entry)
  }

  return arr
}

async function executeProducersOnFiles (files: string[], check: boolean, watch: boolean): Promise<number> {
  let exitCode = 0

  const producers = files.filter(isProducer)

  for (const producerPath of producers) {
    const producer = requireProducer(producerPath)
    const currentProducedFiles = producer(files)

    if (!watch) console.info(blue(`[PRODUCE] ${path.relative(root(), producerPath)}`))

    for (const file of currentProducedFiles) {
      const filePath = path.relative(root(), file.path)

      let content = ''

      try {
        content = (await fs.readFile(file.path)).toString()
      } catch (err) {}

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

async function executeProducers (check: boolean, watch: boolean): Promise<number | void> {
  if (!watch) {
    return await executeProducersOnFiles((await walk(frontendJsDir)), check, watch)
  }

  await executeProducersOnFiles((await walk(frontendJsDir)), check, watch)

  const watcher = chokidar.watch(frontendJsDir, {
    awaitWriteFinish: {
      stabilityThreshold: 75,
      pollInterval: 15
    },
    ignoreInitial: true
  })

  watcher.on('all', (event, path): void => {
    void (async (): Promise<void> => {
      if (event === 'unlink' || event === 'add' || (event === 'change' && isProducer(path))) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete require.cache[require.resolve(path)]
        } catch (err) {}

        void executeProducersOnFiles(await walk(frontendJsDir), check, watch)
      }
    })()
  })
}

class ProducersCliCommand extends Command {
  static description = ''

  static flags = {
    help: flags.help(),
    check: flags.boolean({ default: false, description: 'Just check files' }),
    watch: flags.boolean({ default: false, description: 'Watch for changes' })
  }

  async run (): Promise<void> {
    const { flags: { check, watch } } = this.parse(ProducersCliCommand)

    const exitCode = await executeProducers(check, watch)

    if (typeof exitCode === 'number') this.exit(exitCode)
  }
}

export = ProducersCliCommand
