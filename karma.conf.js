module.exports = function(config) 
{
  var testWebpackConfig = require('./webpack.test.js')({env: 'test'});

  var configuration = 
  {

    basePath: '',

    frameworks: ['jasmine'],

    exclude: [ ],

    files: [ { pattern: './specs.js', watched: false } ],

    preprocessors: { './specs.js': ['coverage', 'webpack', 'sourcemap'] },

    webpack: testWebpackConfig,

    coverageReporter: { type: 'in-memory' },

    remapCoverageReporter: 
    {
      'text-summary': null,
      json: './coverage/coverage.json',
      html: './coverage/html'
    },

    webpackMiddleware: { stats: 'errors-only'},

    reporters: [ 'mocha', 'coverage', 'remap-coverage' ],
    
    port: 9876,

    colors: true,

    // config.( LOG_DISABLE | config.LOG_ERROR | config.LOG_WARN | config.LOG_INFO | config.LOG_DEBUG )
    logLevel: config.LOG_ERROR,

    autoWatch: false,

    browsers: [ 'Chrome' ],

    singleRun: true
  };

  config.set(configuration);
};
