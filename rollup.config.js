import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';

const copyrightNotice = `/**
 * @license MeeusSunMoon v2.0.0\n * (c) 2018 Jan Greis
 * licensed under MIT
 */
`;

/**
* @param {boolean} minify Whether to minify output
* @param {'umd'|'es'} format Rollup output format
* @returns {object} Individual Rollup config object
*/
function rollupConfig (minify, format) {
  const config = {
    external: ['moment-timezone'],
    input: 'src/index.js',
    output: {
      banner: copyrightNotice,
      file: `dist/meeussunmoon${
        format === 'es' ? '-es' : ''
      }${minify ? '.min' : ''}.js`,
      format,
      name: 'MeeusSunMoon'
    },
    plugins: []
  };
  if (format === 'umd') {
    config.plugins.push(babel());
  }
  if (minify) {
    config.plugins.push(terser({output: {preamble: copyrightNotice}}));
    config.output.sourcemap = true;
  }
  return config;
}

export default [
  rollupConfig(false, 'umd'),
  rollupConfig(true, 'umd'),
  rollupConfig(false, 'es'),
  rollupConfig(true, 'es')
];
