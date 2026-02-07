const path = require('path');
const rspack = require('@rspack/core');

const ROOT_DIR = __dirname;
module.exports = function (env) {
  const production = env && env.production;
  let config = {
    entry: {
      simplepicker: './lib/index.ts'
    },
    output: {
      filename: '[name].js',
      path: path.resolve(ROOT_DIR, 'dist'),
      library: 'SimplePicker',
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
          { from: 'lib/simplepicker.css', to: 'simplepicker.css' }
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
              target: 'es5',
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
        'simplepicker.node': './lib/index.ts'
      },
      output: {
        ...config.output,
        library: undefined,
        libraryTarget: 'commonjs2',
      },
      plugins: [],
    };

    config = [config, nodeConfig];
  } else {
    config.output.publicPath = '/dist/';
  }

  return config;
};
