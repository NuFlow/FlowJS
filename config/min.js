// Rollup plugins
import flow from 'rollup-plugin-flow'
import strip from '@rollup/plugin-strip'
import cleanup from 'rollup-plugin-cleanup'
import { terser } from 'rollup-plugin-terser'
import filesize from 'rollup-plugin-filesize'
import gzipPlugin from 'rollup-plugin-gzip'

function onwarn(warning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    // eslint-disable-next-line no-console
    console.warn(`(!) ${warning.message}`)
  }
}

export default {
  onwarn,
  input: 'lib/index.js',
  output: {
    file: 'build/flow.min.js',
    format: 'iife',

    //exports: 'none',
    exports: 'default',

    sourcemap: false,
    freeze: false,
    preferConst: true,
  },

  plugins: [
    flow({
      all: true,
      pretty: true
    }),

    cleanup({
      extensions: ['ts', 'js', 'jsx'],
    }),

    strip({
      functions: ['console.log'],
    }),

    terser({ format: { comments: false } }),

    filesize({
      showMinifiedSize: false
    }),

    gzipPlugin(),
  ],
}
