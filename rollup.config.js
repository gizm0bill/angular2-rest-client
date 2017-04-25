import rollup      from 'rollup'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs    from 'rollup-plugin-commonjs';
import uglify      from 'rollup-plugin-uglify'

export default
{
  entry: 'dist/index.js',
  dest: 'dist/bundles/index.umd.js',
  sourceMap: true,
  sourceMapFile: 'dist/index.umd.js.map',
  format: 'umd', //'iife',
  moduleName: 'angular2.rest.client',
  onwarn: function(warning) 
  {
    if ( warning.code === 'THIS_IS_UNDEFINED' ) { return; }
    console.warn( warning.message );
  },
  plugins: 
  [
    nodeResolve({jsnext: true, module: true}),
    commonjs({ include: 'node_modules/rxjs/**', }),
    uglify()
  ],
  globals: 
  {
    'rxjs/Observable': 'Rx',
    '@angular/core': 'ng.core',
    '@angular/http': 'ng.http',
    'rxjs/add/observable/fromPromise': 'Rx.Observable',
    'rxjs/add/observable/of': 'Rx.Observable',
    'rxjs/add/operator/map': 'Rx.Observable',
    'rxjs/add/operator/mergeMap': 'Rx.Observable',
    'rxjs/add/operator/catch': 'Rx.Observable',
    'rxjs/add/operator/share': 'Rx.Observable',
    'reflect-metadata': 'Reflect',
  }
}