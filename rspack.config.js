const path = require('path');
const rspack = require('@rspack/core');

const ROOT_DIR = __dirname;

// ES2017: the library already relies on unpolyfilled ES2015+ APIs
// (Array.from, String.prototype.repeat, DOMParser), so an ES5 target never
// bought IE11 support - it only added class / spread / template-literal
// helpers to the bundle.
const swcOptions = (moduleType) => ({
  jsc: {
    parser: { syntax: 'typescript' },
    target: 'es2017',
  },
  module: { type: moduleType },
});

module.exports = function (env) {
  const production = env && env.production;
  let config = {
    entry: {
      easyepoch: './lib/index.ts'
    },
    output: {
      filename: '[name].js',
      path: path.resolve(ROOT_DIR, 'dist'),
      library: 'EasyEpoch',
      libraryTarget: 'var'
    },
    resolve: {
      extensions: ['.css', '.ts', '.js']
    },
    context: ROOT_DIR,
    target: 'web',
    mode: production ? 'production' : 'development',
    devtool: 'source-map',
    optimization: {
      moduleIds: 'deterministic'
    },
    plugins: [
      new rspack.CopyRspackPlugin({
        patterns: [
          { from: 'lib/easyepoch.css', to: 'easyepoch.css' }
        ]
      })
    ],
    module: {
      rules: [
        // The ESM entry (lib/index.esm.ts) must be compiled as a real ES
        // module so the bundle can carry `export default`. Everything else
        // stays CommonJS because lib/index.ts uses `export = EasyEpoch`,
        // which swc refuses to compile under an ESM target.
        {
          test: /index\.esm\.ts$/,
          loader: 'builtin:swc-loader',
          options: swcOptions('es6'),
          type: 'javascript/auto',
        },
        {
          test: /\.ts$/,
          exclude: [/node_modules/, /tests/, /index\.esm\.ts$/],
          loader: 'builtin:swc-loader',
          options: swcOptions('commonjs'),
          type: 'javascript/auto',
        }
      ]
    }
  };

  if (production) {
    // build a commonjs format file for consumption with
    // build tools like webpack, rspack, and rollup.
    const nodeConfig = {
      ...config,
      entry: {
        'easyepoch.node': './lib/index.ts'
      },
      output: {
        ...config.output,
        // Use the modern `library` object form, NOT `library: undefined` +
        // the deprecated `libraryTarget`. Under rspack 2 that combination
        // exported the entry's (empty) static namespace, so
        // `require('easyepoch')` returned `{}` instead of the class
        // (regression shipped in 2.0.0). `type: 'commonjs2'` restores
        // `module.exports = EasyEpoch`, matching how `export = EasyEpoch`
        // is consumed via require() and default import.
        library: { type: 'commonjs2' },
      },
      plugins: [],
    };

    // Build a real ES module so bundlers and native ESM (`import`, and
    // `<script type="module">` straight from a CDN) get a module instead of
    // going through CommonJS interop. Built from lib/index.esm.ts - see the
    // loader rules above for why a separate entry is required. The .mjs
    // extension matters: this package is CommonJS ("type" is unset), so a
    // plain .js file would be parsed as CommonJS by Node.
    const esmConfig = {
      ...config,
      entry: {
        easyepoch: './lib/index.esm.ts'
      },
      output: {
        ...config.output,
        filename: '[name].mjs',
        library: { type: 'module' },
        module: true,
        chunkFormat: 'module',
      },
      experiments: { outputModule: true },
      plugins: [],
    };

    config = [config, nodeConfig, esmConfig];
  } else {
    config.output.publicPath = '/dist/';
  }

  return config;
};
