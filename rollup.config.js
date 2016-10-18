export default
{
  entry: 'dist/index.js',
  dest: 'dist/bundles/index.umd.js',
  format: 'umd',
  moduleName: 'angular2.rest.client',
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
    'reflect-metadata': 'Reflect'
  }
}