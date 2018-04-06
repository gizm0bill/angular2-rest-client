import rollup      from 'rollup'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs    from 'rollup-plugin-commonjs';
import uglify      from 'rollup-plugin-uglify'

export default
{
  input: 'dist/index.js',
  output:
  {
    name: 'angular2.rest.client',
    sourceMap: true,
    sourceMapFile: 'dist/index.umd.js.map',
    format: 'umd', //'iife',
    dest: 'dist/bundles/index.umd.js',
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
  },
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
  
}