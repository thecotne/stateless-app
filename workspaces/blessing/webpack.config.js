const webpack = require('webpack')
const path = require('path')
// const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const postcssSafeParser = require('postcss-safe-parser')
// const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const os = require('os')
const autoprefixer = require('autoprefixer')
const babelrc = require('./.babelrc.js')

const abs = str => path.resolve(__dirname, str)
const rootAbs = str => path.resolve(abs('../..'), str)
const groundAbs = str => path.resolve(rootAbs('workspaces/frontend'), str)
// const oneOf = (...arr) => arr.find(path => fs.existsSync(path))
// const die = (msg, code = 1) => {
//   console.warn(msg)
//   process.exit(code)
// }

function getWorkers (env, argv) {
  const cpus = os.cpus()

  if (cpus) {
    return cpus.length * 2
  } else {
    return 4
  }
}

// function getHttps (env, argv) {
//   if (env.https) {
//     const certs = {
//       key: abs('certs/stateless-app.test.key'),
//       cert: abs('certs/stateless-app.test.cert')
//     }
//
//     if (fs.existsSync(certs.key) && fs.existsSync(certs.cert)) {
//       return {
//         key: fs.readFileSync(certs.key),
//         cert: fs.readFileSync(certs.cert)
//       }
//     }
//   }
//
//   return false
// }

module.exports = (env = {}, argv = {}) => {
  const production = argv.mode === 'production'
  const https = false
  // const https = getHttps(env, argv)
  const workers = getWorkers()

  env.cirDep = true

  const babelConfig = {
    babelrc: false,
    cacheDirectory: true,
    root: groundAbs('.'),
    ...babelrc
  }

  const config = {
    optimization: {
      splitChunks: {
        chunks: 'async',
        minSize: 30000,
        maxSize: 0,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: '~',
        name: true,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      },
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: false,
          terserOptions: {
            output: {
              comments: false
            }
          }
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: postcssSafeParser,
            discardComments: {
              removeAll: true
            }
          }
        })
      ]
    },
    entry: {
      index: [
        require.resolve('core-js/stable'),
        require.resolve('regenerator-runtime/runtime'),
        groundAbs('.'),
        groundAbs('sass')
        // groundAbs('stories')
      ]
    },
    output: {
      path: rootAbs('public'),
      filename: 'cache/js/[name]-[chunkhash].js',
      chunkFilename: 'cache/js/[name]-[chunkhash].chunk.js',
      publicPath: '/'
    },
    resolve: {
      modules: [
        rootAbs('node_modules'),
        abs('node_modules'),
        groundAbs('node_modules'),
        groundAbs('sass'),
        groundAbs('.')
      ],
      extensions: ['.js', '.json', '.scss']
    },
    node: false,
    module: {
      rules: [
        {
          test: require.resolve('./env.js'),
          use: [
            {
              loader: 'val-loader',
              options: {
                NODE_ENV: argv.mode
              }
            }
          ]
        },
        {
          test: path => {
            if (!/\.js$/.test(path)) {
              return false
            }

            if (/node_modules/.test(path)) {
              return false
            }

            if (require.resolve('./env.js') === path) {
              return false
            }

            return true
          },
          use: [
            {
              loader: 'thread-loader',
              options: {
                workers
              }
            },
            {
              loader: 'babel-loader',
              options: babelConfig
            }
          ]
        },
        {
          test: /\.(mp4|mp3|jpe?g|png|gif|swf|ttf|eot|svg|woff2?)(\?[a-z0-9]+)?$/,
          loader: 'file-loader',
          query: {
            name: 'cache/assets/[name]-[hash].[ext]'
          }
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                plugins: [
                  autoprefixer({
                    overrideBrowserslist: ['> 0%']
                  })
                ]
              }
            },
            'resolve-url-loader?sourceMap',
            'sass-loader?sourceMap',
            'import-glob-loader'
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        chunksSortMode: 'none',
        title: 'Loading ...',
        filename: 'index.html',
        chunks: ['index'],
        template: 'index.ejs'
        // favicon: 'assets/images/favicon.ico'
      }),

      new MiniCssExtractPlugin({
        filename: 'cache/css/[name]-[chunkhash].css',
        chunkFilename: 'cache/css/[name]-[chunkhash].chunks.css'
      }),

      // new ServiceWorkerWebpackPlugin({
      //   entry: groundAbs('service-worker.js')
      // }),

      new webpack.ProvidePlugin({
        'process.env': require.resolve('./env.js')
      }),

      new UnusedFilesWebpackPlugin({
        // failOnUnused: production,
        failOnUnused: false,
        patterns: ['**/*.*'],
        globOptions: {
          ignore: [
            '**/*_producer.js',
            '**/types.js',
            '**/package.json',
            '**/types/*.js'
          ]
        }
      })
    ],
    devServer: {
      before (app) {
        for (const host of config.devServer.allowedHosts) {
          const protocol = https ? 'https' : 'http'
          const port = config.devServer.port

          console.info(`Project is running at ${protocol}://${host}:${port}/`)
        }
      },
      contentBase: abs('public'),
      historyApiFallback: {
        disableDotRule: true
      },
      host: '0.0.0.0',
      allowedHosts: [
        'stateless-app.test'
      ],
      https,
      disableHostCheck: false,
      port: 8132
    },
    devtool: false,
    performance: {
      hints: false
    },
    context: groundAbs('.')
  }

  if (!production) {
    const WebpackBuildNotifierPlugin = require('webpack-build-notifier')

    config.plugins.push(
      new WebpackBuildNotifierPlugin({
        sound: 'Tink',
        suppressSuccess: true
      })
    )
  }

  if (env.cirDep) {
    const CircularDependencyPlugin = require('circular-dependency-plugin')

    config.stats = 'minimal'
    config.plugins.push(
      new CircularDependencyPlugin({
        exclude: /node_modules/,
        failOnError: false,
        cwd: groundAbs('.')
      })
    )
  }

  return config
}
