import { Inject } from '@angular/core';
import { Headers as NgHeaders, Http, Request, Response, RequestMethod,
  RequestOptions, ResponseContentType, URLSearchParams, QueryEncoder } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/shareReplay';

const Reflect = global['Reflect'];

export class PassThroughQueryEncoder extends QueryEncoder 
{
  encodeKey(k: string): string { return k; }
  encodeValue(v: string): string { return v; }
}
/**
 * actually copied from @angular/http since it's not exported
 * @param value to encode
 */
export function standardEncoding(v) 
{ 
  return encodeURIComponent(v)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/gi, '$')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%2B/gi, '+')
    .replace(/%3D/gi, '=')
    .replace(/%3F/gi, '?')
    .replace(/%2F/gi, '/');
}

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
  Cache: Symbol('apiClient:Cache')
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

export function Query(keyOrParams: any, ...extraOptions: any[])
{
  function decorator <TClass extends { new (...args: any[]): AbstractApiClient }>(target: TClass): TClass;
  function decorator(target: Object, propertyKey?: string | symbol, parameterIndex?: number);
  function decorator(target: Object, propertyKey?: string | symbol, parameterIndex?: number)
  {
    if ( parameterIndex !== undefined ) // on param
    {
      let metadataKey = MetadataKeys.Query;
      let existingParams: Object[] = Reflect.getOwnMetadata( metadataKey, target, propertyKey) || [];
      existingParams.push({ index: parameterIndex, key: keyOrParams, ...extraOptions });
      Reflect.defineMetadata( metadataKey, existingParams, target, propertyKey );
    }
    else // on class
    {
      const metadataKey = MetadataKeys.Query;
      let existingQuery: Object[] = Reflect.getOwnMetadata( metadataKey, target ) || [];
      existingQuery.push({ index: undefined, key: keyOrParams });
      Reflect.defineMetadata( metadataKey, existingQuery, target, undefined );
      return target;
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

// method decorator
export function Cache(arg: number)
{
  return function decorator(target: Object, targetKey?: string | symbol): void
  {
    Reflect.defineMetadata( MetadataKeys.Cache, arg, target, targetKey);
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
  return function(key?: string, ...extraOptions: any[])
  {
    return function(target: AbstractApiClient, propertyKey: string | symbol, parameterIndex: number)
    {
      let metadataKey = MetadataKeys[paramDecoName];
      let existingParams: Object[] = Reflect.getOwnMetadata( metadataKey, target, propertyKey) || [];
      existingParams.push({ index: parameterIndex, key, ...extraOptions });
      Reflect.defineMetadata( metadataKey, existingParams, target, propertyKey );
    };
  };
};

// param decorator
export var Path = buildParamDeco('Path');
// param decorator
export var Body = buildParamDeco('Body');
// param decorator
export var Header = buildParamDeco('Header');

const cacheMap = new Map;

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
        let requestUrl = url;
        if ( this.http === undefined )
          throw new TypeError(`Property 'http' missing in ${this.constructor}. Check constructor dependencies!`);

        // query params
        let defaultQueryParams: any[] = Reflect.getOwnMetadata(MetadataKeys.Query, target.constructor),
            queryParams: any[] = Reflect.getOwnMetadata(MetadataKeys.Query, target, targetKey),
            query = new URLSearchParams('', new PassThroughQueryEncoder());
        // TODO see headers processing and make something common
        defaultQueryParams && defaultQueryParams.forEach( defaQuery => 
        {
          let _q = extend({}, defaQuery);
          for ( let _qk in _q.key ) 
          {
            if ( typeof _q.key[_qk] === 'function' ) _q.key[_qk] = _q.key[_qk].call(this);
            query.set( _qk, _q.key[_qk] );
          }
        });
        queryParams && queryParams.filter( p => args[p.index] !== undefined )
          .forEach( p => 
          {
            let queryKey, queryVal;
            // don't uri encode flagged params
            if ( Object.values(p).indexOf(NO_ENCODE) !== -1 ) [ queryKey, queryVal ] = [ p.key, args[p.index] ];
            else [ queryKey, queryVal ] = [ standardEncoding(p.key), standardEncoding(args[p.index]) ];
            return query.set( queryKey, queryVal );
          });

        // path params
        let pathParams: any[] = Reflect.getOwnMetadata(MetadataKeys.Path, target, targetKey);
        pathParams && pathParams.filter( p => args[p.index] !== undefined )
          .forEach( p => requestUrl = requestUrl.replace(`{${p.key}}`, args[p.index]) );

        // process headers
        let _headers = {},
            defaultHeaders = Reflect.getOwnMetadata(MetadataKeys.Header, target.constructor ),
            methodHeaders = Reflect.getOwnMetadata(MetadataKeys.Header, target, targetKey);
        
        defaultHeaders && defaultHeaders.forEach( header => 
        {
          let _h = extend({}, header);
          for ( let _hk in _h.key ) if ( typeof _h.key[_hk] === 'function' ) _h.key[_hk] = _h.key[_hk].call(this);
          extend( _headers, _h.key ) 
        });
        methodHeaders && methodHeaders.forEach( h =>
        {
          let k = {};
          // param header from @Header
          if ( typeof h.key === 'string' ) k[h.key] = args[h.index];
          // method header from @Headers, use smth like @Headers(function(){ return { Key: smth.call(this) }; }), hacky, I know
          else if ( typeof h.key === 'function' ) k = h.key.call(this);
          else k = h.key;
          // TODO add to headers rather than overwrite?
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
          // single unamed body param, add value as is, usually string
          else if ( bodyParams.length === 1 && bodyParams[0].key === undefined )
            body = args[bodyParams[0].index];
          // plain object
          else
          {
            bodyParams.map( p => { return { [p.key]: args[p.index] }; }).forEach( p => Object.assign(body, p) );
            body = JSON.stringify( body );
          }
        }

        // handle @Type
        let responseType = Reflect.getOwnMetadata(MetadataKeys.Type, target, targetKey);

        const makeReq = ( method, baseUrl, requestUrl, headers, body, query, responseType ) =>
        {
          const options = new RequestOptions({ method, url: baseUrl + requestUrl, headers, body, search: query, responseType });
          return new Request(options);
        },
        getCacheKey = ( url, headers: NgHeaders, query, responseType ) =>
        {
          let headerArr = [];
          headers.forEach( (value, name) => headerArr.push( name, headers.getAll(name).join() ) );
          return [url, headerArr.join(), query, responseType].join()
        };
        // get baseUrl from Promise, file or simple string 
        let baseUrlObs = this.getBaseUrl ? this.getBaseUrl( requestUrl ) : Observable.of('');
        let observable = baseUrlObs
        .flatMap( baseUrl =>
        {
          // check if we got a cache meta and entry
          const cacheTime = Reflect.getOwnMetadata( MetadataKeys.Cache, target, targetKey );
          if ( cacheTime )
          {
            const cacheMapKey = getCacheKey( baseUrl + requestUrl, headers, query, responseType ),
                  cacheMapEntry = cacheMap.get(cacheMapKey);
            if ( cacheMapEntry &&  ( +new Date ) < cacheMapEntry[0] + cacheTime ) observable = cacheMapEntry[1];
            else 
            {
              observable = <Observable<Response>> this.http.request(makeReq(method, baseUrl, requestUrl, headers, body, query, responseType)).shareReplay();
              cacheMap.set( cacheMapKey, [ +new Date, observable ] );
            }
          }
          else
            // observable request
            observable = <Observable<Response>> this.http.request(makeReq(method, baseUrl, requestUrl, headers, body, query, responseType)).share();
          
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
// method decorator
export var PATCH = buildMethodDeco(RequestMethod.Patch);

// Don't encode Query parameters
export const NO_ENCODE = Symbol('apiClient:Query.noEncode');
