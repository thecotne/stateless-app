module.exports = {
  presets: [
    [
      '@babel/preset-env', {
        forceAllTransforms: true,
        loose: true,
        modules: false,
        useBuiltIns: 'entry',
        corejs: 3
      }
    ],
    [
      '@babel/preset-react', {
        runtime: 'automatic'
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties'
  ]
}
