import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const copyrightNotice = `/**
 * @license MeeusSunMoon v3.0.0
 * (c) 2018 Jan Greis
 * licensed under MIT
 */
`;

/**
 * @param {boolean} minify Whether to minify output
 * @param {'umd'|'es'} format Rollup output format
 * @returns {object} Individual Rollup config object
 */
const rollupConfig = (minify, format) => {
    const config = {
        external: ['luxon'],
        input: 'src/index.ts',
        output: {
            banner: copyrightNotice,
            file: `dist/meeussunmoon${
                format === 'es' ? '-es' : ''
            }${minify ? '.min' : ''}.js`,
            format,
            name: 'MeeusSunMoon',
            globals: format === 'es' ? {} : { luxon: 'luxon' },
        },
        plugins: [typescript({
            typescript: require('typescript'),
        })],
    };
    if (minify) {
        config.plugins.push(terser());
        config.output.sourcemap = true;
    }
    return config;
};

export default [
    rollupConfig(false, 'umd'),
    rollupConfig(true, 'umd'),
    rollupConfig(false, 'es'),
    rollupConfig(true, 'es'),
];
