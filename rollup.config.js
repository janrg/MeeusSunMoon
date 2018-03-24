import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

function rollupConfig(minify, format) {
  const copyrightNotice = '/**\n * @license MeeusSunMoon v2.0.0\n * (c) 2018 Jan Greis\n * licensed under MIT\n */\n';
  const config = {
    input: 'src/index.js',
    output: {
      format,
      file: `dist/meeussunmoon${format === 'es' ? '-es' : ''}${minify ? '.min' : ''}.js`,
      name: 'MeeusSunMoon',
      banner: copyrightNotice
    },
    plugins: [],
  };
  if (format == 'umd') {
    config.plugins.push(babel());
  }
  if (minify) {
    config.plugins.push(uglify({output: {preamble: copyrightNotice}}));
    config.output.sourcemap = true;
  }
  return config;
};

export default [
  rollupConfig(false, 'umd'),
  rollupConfig(true, 'umd'),
  rollupConfig(false, 'es'),
  rollupConfig(true, 'es')
];
