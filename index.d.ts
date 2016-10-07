/// <reference types="core-js" />
declare module "angular2-rest" {
    import { Http, ResponseContentType } from '@angular/http';
    import { Observable } from 'rxjs/Observable';
    import 'reflect-metadata';
    import 'rxjs/add/observable/fromPromise';
    import 'rxjs/add/observable/of';
    import 'rxjs/add/operator/map';
    import 'rxjs/add/operator/mergeMap';
    import 'rxjs/add/operator/catch';
    import 'rxjs/add/operator/share';
    import 'rxjs/add/operator/cache';
    export abstract class AbstractApiClient {
        protected http: Http;
        constructor(http: Http);
    }
    /**
     * class decorator
     *
     * @param url - will use this exact string as BaseUrl, unless `configKey` is passed; function - will get assigned to protorype.getBaseUrl
     * @param configKey - will request `url` and get this key from the resulting json
     */
    export function BaseUrl(url: (() => Observable<string>) | string, configKey?: string): <TClass extends new (...args: any[]) => AbstractApiClient>(Target: TClass) => TClass;
    /**
     * class decorator
     * method decorator
     */
    export function Headers(headers: {}): {
        <TClass extends new (...args: any[]) => AbstractApiClient>(target: TClass): TClass;
        (target: Object, targetKey: string | symbol): void;
    };
    export function Type(arg: ResponseContentType): (target: Object, targetKey?: string | symbol) => void;
    /**
     * class decorator
     */
    export function Error(handler: (...args: any[]) => any): <TClass extends new (...args: any[]) => AbstractApiClient>(target: TClass) => TClass;
    export var Path: (key?: string) => (target: AbstractApiClient, propertyKey: string | symbol, parameterIndex: number) => void;
    export var Query: (key?: string) => (target: AbstractApiClient, propertyKey: string | symbol, parameterIndex: number) => void;
    export var Body: (key?: string) => (target: AbstractApiClient, propertyKey: string | symbol, parameterIndex: number) => void;
    export var Header: (key?: string) => (target: AbstractApiClient, propertyKey: string | symbol, parameterIndex: number) => void;
    export var GET: (url?: string) => (target: AbstractApiClient, targetKey?: string | symbol, descriptor?: PropertyDescriptor) => PropertyDescriptor;
    export var POST: (url?: string) => (target: AbstractApiClient, targetKey?: string | symbol, descriptor?: PropertyDescriptor) => PropertyDescriptor;
    export var PUT: (url?: string) => (target: AbstractApiClient, targetKey?: string | symbol, descriptor?: PropertyDescriptor) => PropertyDescriptor;
    export var DELETE: (url?: string) => (target: AbstractApiClient, targetKey?: string | symbol, descriptor?: PropertyDescriptor) => PropertyDescriptor;
    export var HEAD: (url?: string) => (target: AbstractApiClient, targetKey?: string | symbol, descriptor?: PropertyDescriptor) => PropertyDescriptor;
    export var OPTIONS: (url?: string) => (target: AbstractApiClient, targetKey?: string | symbol, descriptor?: PropertyDescriptor) => PropertyDescriptor;
}
