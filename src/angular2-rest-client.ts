import 'core-js/es7/reflect';
import { Inject } from '@angular/core';
import { Headers as NgHeaders, Http, Request, Response, RequestMethod,
  RequestOptions, ResponseContentType, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/share';

function isObject(item)
{
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}
function extend<T, U>(target: T, source: U) : T & U
{
  if ( !isObject(target) || !isObject(source) ) return target as T & U;
  Object.keys(source).forEach( key =>
  {
    if ( isObject(source[key]) )
    {
      if ( !target[key] ) Object.assign(target, { [key]: {} });
      extend( target[key], source[key] );
    }
    else
      Object.assign( target, { [key]: source[key] });
  });
  return target as T & U;
}

// abstract Api class
export abstract class AbstractApiClient
{
  constructor( @Inject(Http) protected http: Http ) { }
}

// reflect metadata key symbols
const MetadataKeys =
{
  Query: Symbol('apiClient:Query'),
  Path: Symbol('apiClient:Path'),
  Body: Symbol('apiClient:Body'),
  Header: Symbol('apiClient:Header'),
  Type: Symbol('apiClient:ResponseType'),
  Error: Symbol('apiClient:Error'),
};

/**
 * class decorator
 * 
 * @param url - will use this exact string as BaseUrl, unless `configKey` is passed; function - will get assigned to protorype.getBaseUrl
 * @param configKey - will request `url` and get this key from the resulting json
 */
export function BaseUrl(url: (() => Observable<string>) | string, configKey?: string)
{
  return function <TClass extends { new (...args: any[]): AbstractApiClient }>
  (Target: TClass): TClass
  {
    if ( url instanceof Function ) Target.prototype.getBaseUrl = url;
    // request from external
    else if ( configKey )
    {
      let cached;
      Target.prototype.getBaseUrl = function()
      {
        let x = !cached ? (cached = this.http.get(url).map( r => r.json()[configKey] ).share()) : cached;
        return x;
      };
    }
    else Target.prototype.getBaseUrl = () => Observable.fromPromise( Promise.resolve(url) );
    return Target;
  };
}

/**
 * class decorator
 * method decorator
 */
export function Headers(headers: {})
{
  function decorator <TClass extends { new (...args: any[]): AbstractApiClient }>(target: TClass): TClass;
  function decorator(target: Object, targetKey: string | symbol): void;
  function decorator(target: Object, targetKey?: string | symbol): void
  {
    let metadataKey = MetadataKeys.Header;
    if ( targetKey !== undefined )
    {
      let existingHeaders: Object[] = Reflect.getOwnMetadata( metadataKey, target, targetKey) || [];
      existingHeaders.push({ index: undefined, key: headers });
      Reflect.defineMetadata( metadataKey, existingHeaders, target, targetKey );
    }
    else // class type
    {
      let existingHeaders: Object[] = Reflect.getOwnMetadata( metadataKey, target) || [];
      existingHeaders.push({ index: undefined, key: headers });
      Reflect.defineMetadata( metadataKey, existingHeaders, target, undefined );
    }
  }
  return decorator;
}

// method decorator
export function Type(arg: ResponseContentType)
{
  return function decorator(target: Object, targetKey?: string | symbol): void
  {
    Reflect.defineMetadata( MetadataKeys.Type, arg, target, targetKey);
  };
}

// class decorator
export function Error(handler: (...args: any[]) => any )
{
  function decorator <TClass extends { new (...args: any[]): AbstractApiClient }>(target: TClass): TClass
  {
    Reflect.defineMetadata( MetadataKeys.Error, handler, target );
    return target;
  }
  return decorator;
}

// build method parameters decorators
let buildParamDeco = (paramDecoName: string) =>
{
  return function(key?: string)
  {
    return function(target: AbstractApiClient, propertyKey: string | symbol, parameterIndex: number)
    {
      let metadataKey = MetadataKeys[paramDecoName];
      let existingParams: Object[] = Reflect.getOwnMetadata( metadataKey, target, propertyKey) || [];
      existingParams.push({ index: parameterIndex, key });
      Reflect.defineMetadata( metadataKey, existingParams, target, propertyKey );
    };
  };
};

// param decorator
export var Path = buildParamDeco('Path');
// param decorator
export var Query = buildParamDeco('Query');
// param decorator
export var Body = buildParamDeco('Body');
// param decorator
export var Header = buildParamDeco('Header');

// build method decorators
let buildMethodDeco = (method: any) =>
{
  return (url: string = '') =>
  {
    return (target: AbstractApiClient, targetKey?: string | symbol, descriptor?: PropertyDescriptor) =>
    {
      // let oldValue = descriptor.value;
      descriptor.value = function(...args: any[]): Observable<any>
      {
        if ( this.http === undefined )
          throw new TypeError(`Property 'http' missing in ${this.constructor}. Check constructor dependencies!`);

        // query params
        let queryParams: any[] = Reflect.getOwnMetadata(MetadataKeys.Query, target, targetKey),
            query = new URLSearchParams;
        queryParams && queryParams.filter( p => args[p.index] )
          .forEach( p => query.set( encodeURIComponent(p.key), encodeURIComponent( args[p.index] ) ) );

        // path params
        let pathParams: any[] = Reflect.getOwnMetadata(MetadataKeys.Path, target, targetKey);
        pathParams && pathParams.filter( p => args[p.index] )
          .forEach( p => url = url.replace(`{${p.key}}`, args[p.index]) );

        // process headers
        let _headers = {},
            defaultHeaders = Reflect.getOwnMetadata(MetadataKeys.Header, target.constructor ),
            methodHeaders = Reflect.getOwnMetadata(MetadataKeys.Header, target, targetKey);
        defaultHeaders && defaultHeaders.forEach( h => 
        {
          for ( let _hk in h.key ) if ( typeof h.key[_hk] === 'function' ) h.key[_hk] = h.key[_hk].call(this);
          extend( _headers, h.key ) 
        });
        methodHeaders && methodHeaders.forEach( h =>
        {
          let k = {};
          // param header from @Header
          if ( typeof h.key === 'string' ) k[h.key] = args[h.index];
          // method header from @Headers
          else if ( typeof h.key === 'function' ) k[h.key] = h.key.call(this);
          else k = h.key;
          extend( _headers, k );
        });
        let headers = new NgHeaders(_headers);

        // handle @Body
        let bodyParams: any[] = Reflect.getOwnMetadata(MetadataKeys.Body, target, targetKey),
            body: any = {};
        if ( bodyParams )
        {
          bodyParams = bodyParams.filter( p => args[p.index] !== undefined );
          // see if we got some Files inside
          if ( bodyParams.some( p => args[p.index] instanceof File || args[p.index] instanceof FileList ) )
          {
            body = new FormData;
            bodyParams.forEach( p =>
            {
              let bodyArg: File|File[] = args[p.index];
              if ( bodyArg instanceof FileList ) for ( let f of <File[]>bodyArg )
                body.append( p.key || 'files[]', f, f.name );
              else if ( bodyArg instanceof File )
                body.append( p.key || 'files[]', bodyArg, bodyArg.name );
              else
                body.append( p.key || 'params[]', bodyArg );
            });
          }
          // plain object
          else
          {
            bodyParams.map( p => { return { [p.key]: args[p.index] }; }).forEach( p => Object.assign(body, p) );
            body = JSON.stringify( body );
          }
        }

        // handle @Type
        let responseType = Reflect.getOwnMetadata(MetadataKeys.Type, target, targetKey);

        // get baseUrl from Promise, file or simple string 
        let baseUrlObs = this.getBaseUrl ? this.getBaseUrl() : Observable.of('');
        let observable = baseUrlObs
        .flatMap( baseUrl =>
        {
          let options = new RequestOptions({ method, url: baseUrl + url, headers, body, search: query, responseType }),
              request = new Request(options);

          // observable request
          observable = <Observable<Response>> this.http.request(request).share();
          // plugin error handler if any
          let errorHandler = Reflect.getOwnMetadata(MetadataKeys.Error, target.constructor );
          errorHandler && (observable = <Observable<Response>>observable.catch( errorHandler ));

          // oldValue.call(this, observable)

          return observable;
        });
        return observable;

      };

      return descriptor;
    };
  };
};

// method decorator
export var GET = buildMethodDeco(RequestMethod.Get);
// method decorator
export var POST = buildMethodDeco(RequestMethod.Post);
// method decorator
export var PUT = buildMethodDeco(RequestMethod.Put);
// method decorator
export var DELETE = buildMethodDeco(RequestMethod.Delete);
// method decorator
export var HEAD = buildMethodDeco(RequestMethod.Head);
// method decorator
export var OPTIONS = buildMethodDeco(RequestMethod.Options);

