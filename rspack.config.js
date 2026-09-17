const path = require('path');
const rspack = require('@rspack/core');

const ROOT_DIR = __dirname;
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
        {
          test: /\.ts$/,
          exclude: [/node_modules/, /tests/],
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
              // ES2017: the library already relies on unpolyfilled ES2015+
              // APIs (Array.from, String.prototype.repeat, DOMParser), so an
              // ES5 target never bought IE11 support - it only added class /
              // spread / template-literal helpers to the bundle.
              target: 'es2017',
            },
            module: {
              type: 'commonjs',
            },
          },
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

    config = [config, nodeConfig];
  } else {
    config.output.publicPath = '/dist/';
  }

  return config;
};
