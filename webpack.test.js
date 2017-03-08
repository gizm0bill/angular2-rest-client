var path = require('path');
var webpack = require('webpack');
var ROOT = path.resolve(__dirname, '.');
function root(args) 
{
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [ROOT].concat(args));
}

/**
 * Webpack configuration
 */
module.exports = function(options) 
{
  return {
    /**
     * Source map for Karma from the help of karma-sourcemap-loader &  karma-webpack
     * Do not change, leave as is or it wont work.
     */
    devtool: 'inline-source-map',

    entry: {
      'main': './tests/angular2-rest-client.spec.ts'
    },
    resolve: 
    {
      extensions: ['.ts', '.js'],
      modules: ['test', 'node_modules'],
    },
    plugins: 
    [
       new webpack.LoaderOptionsPlugin
       ({
         options: { verbose: true, debug: true }
       })
    ],
    module: 
    {
      loaders: 
      [
        /**
         * Source map loader support for *.js files
         * Extracts SourceMaps for source files that as added as sourceMappingURL comment.
         * See: https://github.com/webpack/source-map-loader
         */
        {
          enforce: 'pre',
          test: /\.js$/,
          loader: 'source-map-loader',
          exclude: 
          [
            // these packages have problems with their sourcemaps
            root('node_modules/rxjs'),
            root('node_modules/@angular')
          ],
          enforce: 'pre'
        },

      /**
       * An array of automatically applied loaders.
       * IMPORTANT: The loaders here are resolved relative to the resource which they are applied to.
       * This means they are not resolved relative to the configuration file.
       * See: http://webpack.github.io/docs/configuration.html#module-loaders
       */
        {
          test: /\.ts$/,
          loader: 'awesome-typescript-loader',
          query: {
            // use inline sourcemaps for "karma-remap-coverage" reporter
            sourceMap: false,
            inlineSourceMap: true,
            compilerOptions: { removeComments: true }
          },
          exclude: [/\.e2e\.ts$/]
        },
        /**
         * Instruments JS files with Istanbul for subsequent code coverage reporting.
         * Instrument only testing sources.
         * See: https://github.com/deepsweet/istanbul-instrumenter-loader
         */
        {
          enforce: 'post',
          test: /\.(js|ts)$/, loader: 'istanbul-instrumenter-loader',
          include: root('src'),
          exclude: [ /\.spec\.ts$/, /node_modules/ ]
        }
      ]
    },


    node: 
    {
      global: true,
      process: false,
      crypto: 'empty',
      module: false,
      clearImmediate: false,
      setImmediate: false
    }
  };
}
