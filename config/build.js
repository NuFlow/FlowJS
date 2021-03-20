// Rollup plugins
//import { eslint } from 'rollup-plugin-eslint'
import flow from 'rollup-plugin-flow'
import strip from '@rollup/plugin-strip'
import filesize from 'rollup-plugin-filesize'

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
    file: 'build/flow.js',
    format: 'cjs',

    exports: 'default',
    //exports: 'none',

    sourcemap: 'inline',
    freeze: false,
    preferConst: true,
  },

  plugins: [
    //eslint('config/dev.eslintrc.js'),
    flow({
      all: true,
      pretty: true
    }),

    strip({
      functions: ['console.log'],
    }),

    filesize({
      showMinifiedSize: false
    }),
  ],
}
