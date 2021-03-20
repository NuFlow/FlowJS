// Rollup plugins

import flow from 'rollup-plugin-flow'

function onwarn(warning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    // eslint-disable-next-line no-console
    console.warn(`(!) ${warning.message}`)
  }
}

export default {
  //onwarn,
  input: 'lib/index.js',
  output: {
    file: 'build/flow.dev.js',
    format: 'cjs',

    exports: 'default',

    sourcemap: 'inline',
    freeze: false,
    preferConst: true,
  },

  plugins: [
    flow({
      all: true,
      pretty: true
    })
  ],
}
