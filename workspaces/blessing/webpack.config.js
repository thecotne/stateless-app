const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const postcssSafeParser = require('postcss-safe-parser')
const TerserPlugin = require('terser-webpack-plugin')
const os = require('os')
const autoprefixer = require('autoprefixer')
const babelrc = require('./babelrc.js')
const UnusedFilesWebpackPlugin = require('./webpack-plugins/unused-files')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const statelessrc = require('../../statelessrc')

const abs = str => path.resolve(__dirname, str)
const rootAbs = str => path.resolve(abs('../..'), str)
const frontendAbs = str => path.resolve(rootAbs('workspaces/frontend'), str)

function getWorkers (env, argv) {
  const cpus = os.cpus()

  if (cpus) {
    return cpus.length * 2
  } else {
    return 4
  }
}

module.exports = (env = {}, argv = {}) => {
  const production = argv.mode === 'production'
  const workers = getWorkers()

  const babelConfig = {
    babelrc: false,
    cacheDirectory: true,
    root: frontendAbs('.'),
    ...babelrc
  }

  const config = {
    optimization: {
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            output: {
              comments: false
            }
          },
          extractComments: false
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
        frontendAbs('.'),
        frontendAbs('sass')
      ]
    },
    output: {
      path: rootAbs('public'),
      filename: 'cache/js/[name]-[chunkhash].js',
      chunkFilename: 'cache/js/[name]-[chunkhash].chunk.js',
      publicPath: '/'
    },
    externalsType: 'script',
    externals: statelessrc.externals ?? {},
    resolve: {
      modules: [
        rootAbs('node_modules'),
        abs('node_modules'),
        frontendAbs('node_modules'),
        frontendAbs('sass'),
        frontendAbs('.')
      ],
      extensions: ['.ts', '.tsx', '.js', '.json', '.scss']
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
            if (!/\.(js|ts|tsx)$/.test(path)) {
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
          options: {
            name: 'cache/assets/[name]-[hash].[ext]'
          }
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: require.resolve('postcss-loader'),
              options: {
                postcssOptions: {
                  plugins: [
                    autoprefixer({
                      overrideBrowserslist: ['> 0%']
                    })
                  ]
                }
              }
            },
            'sass-loader'
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
      new webpack.ProvidePlugin({
        'process.env': require.resolve('./env.js')
      }),
      new UnusedFilesWebpackPlugin({
        // failOnUnused: production,
        failOnUnused: false,
        filter (path) {
          if (/[/]node_modules[/]/.test(path)) return false
          if (/[/][.]DS_Store$/.test(path)) return false
          if (/[/]\w+[.]d[.]ts$/.test(path)) return false
          if (/[/]\w+_producer[.]ts$/.test(path)) return false
          if (path === frontendAbs('tsconfig.json')) return false
          if (path === frontendAbs('package.json')) return false

          return true
        }
      }),
      new CircularDependencyPlugin({
        exclude: /[/]blessing[/]env[.]js$|[/]node_modules[/]/,
        failOnError: false,
        cwd: frontendAbs('.')
      })
    ],
    devServer: {
      before (app) {
        for (const host of config.devServer.allowedHosts) {
          const protocol = 'http'
          const port = config.devServer.port

          console.info(`Project is running at ${protocol}://${host}:${port}/`)
        }
      },
      contentBase: abs('public'),
      historyApiFallback: {
        disableDotRule: true
      },
      host: '0.0.0.0',
      allowedHosts: statelessrc.hosts ?? [
        'localhost',
        'stateless-app.test'
      ],
      https: false,
      disableHostCheck: false,
      port: statelessrc.port ?? 8080
    },
    devtool: false,
    performance: {
      hints: false
    },
    context: frontendAbs('.'),
    stats: 'minimal'
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

  return config
}
