import babel from 'rollup-plugin-babel'

export default [
  {
    input: 'src/url-pattern.js',
    plugins: [
      babel({
        babelrc: false,
        plugins: ['external-helpers'],
        presets: [['env', {modules: false}], 'stage-0']
      })
    ],
    output: {
      file: 'lib/url-pattern.js',
      format: 'umd',
      name: 'UrlPattern'
    }
  }
]
