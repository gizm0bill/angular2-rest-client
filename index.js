var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
System.register("angular2-rest", ['@angular/core', '@angular/http', 'rxjs/Observable', 'reflect-metadata', 'rxjs/add/observable/fromPromise', 'rxjs/add/observable/of', 'rxjs/add/operator/map', 'rxjs/add/operator/mergeMap', 'rxjs/add/operator/catch', 'rxjs/add/operator/share', 'rxjs/add/operator/cache'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var core_1, http_1, Observable_1;
    var AbstractApiClient, MetadataKeys, buildParamDeco, Path, Query, Body, Header, buildMethodDeco, GET, POST, PUT, DELETE, HEAD, OPTIONS;
    function isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
    }
    function extend(target, source) {
        if (!isObject(target) || !isObject(source))
            return target;
        Object.keys(source).forEach(function (key) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, (_a = {}, _a[key] = {}, _a));
                extend(target[key], source[key]);
            }
            else
                Object.assign(target, (_b = {}, _b[key] = source[key], _b));
            var _a, _b;
        });
        return target;
    }
    /**
     * class decorator
     *
     * @param url - will use this exact string as BaseUrl, unless `configKey` is passed; function - will get assigned to protorype.getBaseUrl
     * @param configKey - will request `url` and get this key from the resulting json
     */
    function BaseUrl(url, configKey) {
        return function (Target) {
            if (url instanceof Function)
                Target.prototype.getBaseUrl = url;
            else if (configKey) {
                var cached_1;
                Target.prototype.getBaseUrl = function () {
                    return !cached_1 ? (cached_1 = this.http.get(url).map(function (r) { return r.json()[configKey]; }).cache()) : cached_1;
                };
            }
            else
                Target.prototype.getBaseUrl = function () { return Observable_1.Observable.fromPromise(Promise.resolve(url)); };
            return Target;
        };
    }
    exports_1("BaseUrl", BaseUrl);
    /**
     * class decorator
     * method decorator
     */
    function Headers(headers) {
        function decorator(target, targetKey) {
            var metadataKey = MetadataKeys.Header;
            if (targetKey !== undefined) {
                var existingHeaders = Reflect.getOwnMetadata(metadataKey, target, targetKey) || [];
                existingHeaders.push({ index: undefined, key: headers });
                Reflect.defineMetadata(metadataKey, existingHeaders, target, targetKey);
            }
            else {
                var existingHeaders = Reflect.getOwnMetadata(metadataKey, target) || [];
                existingHeaders.push({ index: undefined, key: headers });
                Reflect.defineMetadata(metadataKey, existingHeaders, target, undefined);
            }
        }
        return decorator;
    }
    exports_1("Headers", Headers);
    // method decorator
    function Type(arg) {
        return function decorator(target, targetKey) {
            Reflect.defineMetadata(MetadataKeys.Type, arg, target, targetKey);
        };
    }
    exports_1("Type", Type);
    /**
     * class decorator
     */
    function Error(handler) {
        function decorator(target) {
            Reflect.defineMetadata(MetadataKeys.Error, handler, target);
            return target;
        }
        return decorator;
    }
    exports_1("Error", Error);
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (Observable_1_1) {
                Observable_1 = Observable_1_1;
            },
            function (_1) {},
            function (_2) {},
            function (_3) {},
            function (_4) {},
            function (_5) {},
            function (_6) {},
            function (_7) {},
            function (_8) {}],
        execute: function() {
            // abstract Api class
            AbstractApiClient = (function () {
                function AbstractApiClient(http) {
                    this.http = http;
                }
                AbstractApiClient = __decorate([
                    __param(0, core_1.Inject(http_1.Http)), 
                    __metadata('design:paramtypes', [http_1.Http])
                ], AbstractApiClient);
                return AbstractApiClient;
            }());
            exports_1("AbstractApiClient", AbstractApiClient);
            // reflect metadata key symbols
            MetadataKeys = {
                Query: Symbol('apiClient:Query'),
                Path: Symbol('apiClient:Path'),
                Body: Symbol('apiClient:Body'),
                Header: Symbol('apiClient:Header'),
                Type: Symbol('apiClient:ResponseType'),
                Error: Symbol('apiClient:Error'),
            };
            // build method parameters decorators
            buildParamDeco = function (paramDecoName) {
                return function (key) {
                    return function (target, propertyKey, parameterIndex) {
                        var metadataKey = MetadataKeys[paramDecoName];
                        var existingParams = Reflect.getOwnMetadata(metadataKey, target, propertyKey) || [];
                        existingParams.push({ index: parameterIndex, key: key });
                        Reflect.defineMetadata(metadataKey, existingParams, target, propertyKey);
                    };
                };
            };
            // param decorator
            exports_1("Path", Path = buildParamDeco('Path'));
            // param decorator
            exports_1("Query", Query = buildParamDeco('Query'));
            // param decorator
            exports_1("Body", Body = buildParamDeco('Body'));
            // param decorator
            exports_1("Header", Header = buildParamDeco('Header'));
            // build method decorators
            buildMethodDeco = function (method) {
                return function (url) {
                    if (url === void 0) { url = ''; }
                    return function (target, targetKey, descriptor) {
                        // let oldValue = descriptor.value;
                        descriptor.value = function () {
                            var _this = this;
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i - 0] = arguments[_i];
                            }
                            if (this.http === undefined)
                                throw new TypeError("Property 'http' missing in " + this.constructor + ". Check constructor dependencies!");
                            // query params
                            var queryParams = Reflect.getOwnMetadata(MetadataKeys.Query, target, targetKey), query = new http_1.URLSearchParams;
                            queryParams && queryParams.filter(function (p) { return args[p.index]; })
                                .forEach(function (p) { return query.set(encodeURIComponent(p.key), encodeURIComponent(args[p.index])); });
                            // path params
                            var pathParams = Reflect.getOwnMetadata(MetadataKeys.Path, target, targetKey);
                            pathParams && pathParams.filter(function (p) { return args[p.index]; })
                                .forEach(function (p) { return url = url.replace("{" + p.key + "}", args[p.index]); });
                            // process headers
                            var _headers = {}, defaultHeaders = Reflect.getOwnMetadata(MetadataKeys.Header, target.constructor), methodHeaders = Reflect.getOwnMetadata(MetadataKeys.Header, target, targetKey);
                            defaultHeaders && defaultHeaders.forEach(function (h) { return extend(_headers, h.key); });
                            methodHeaders && methodHeaders.forEach(function (h) {
                                var k = {};
                                // param header from @Header
                                if (typeof h.key === 'string')
                                    k[h.key] = args[h.index];
                                else
                                    k = h.key;
                                extend(_headers, k);
                            });
                            var headers = new http_1.Headers(_headers);
                            // handle @Body
                            var bodyParams = Reflect.getOwnMetadata(MetadataKeys.Body, target, targetKey), body = {};
                            if (bodyParams) {
                                bodyParams = bodyParams.filter(function (p) { return args[p.index] !== undefined; });
                                // see if we got some Files inside
                                if (bodyParams.some(function (p) { return args[p.index] instanceof File || args[p.index] instanceof FileList; })) {
                                    body = new FormData;
                                    bodyParams.forEach(function (p) {
                                        var bodyArg = args[p.index];
                                        if (bodyArg instanceof FileList)
                                            for (var _i = 0, _a = bodyArg; _i < _a.length; _i++) {
                                                var f = _a[_i];
                                                body.append(p.key || 'files[]', f, f.name);
                                            }
                                        else if (bodyArg instanceof File)
                                            body.append(p.key || 'files[]', bodyArg, bodyArg.name);
                                        else
                                            body.append(p.key || 'params[]', bodyArg);
                                    });
                                }
                                else {
                                    bodyParams.map(function (p) { return (_a = {}, _a[p.key] = args[p.index], _a); var _a; }).forEach(function (p) { return Object.assign(body, p); });
                                    body = JSON.stringify(body);
                                }
                            }
                            // handle @Type
                            var responseType = Reflect.getOwnMetadata(MetadataKeys.Type, target, targetKey);
                            // get baseUrl from Promise, file or simple string 
                            var baseUrlObs = this.getBaseUrl ? this.getBaseUrl() : Observable_1.Observable.of('');
                            var observable = baseUrlObs
                                .flatMap(function (baseUrl) {
                                var options = new http_1.RequestOptions({ method: method, url: baseUrl + url, headers: headers, body: body, search: query, responseType: responseType }), request = new http_1.Request(options);
                                // observable request
                                observable = _this.http.request(request).share();
                                // plugin error handler if any
                                var errorHandler = Reflect.getOwnMetadata(MetadataKeys.Error, target.constructor);
                                errorHandler && (observable = observable.catch(errorHandler));
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
            exports_1("GET", GET = buildMethodDeco(http_1.RequestMethod.Get));
            // method decorator
            exports_1("POST", POST = buildMethodDeco(http_1.RequestMethod.Post));
            // method decorator
            exports_1("PUT", PUT = buildMethodDeco(http_1.RequestMethod.Put));
            // method decorator
            exports_1("DELETE", DELETE = buildMethodDeco(http_1.RequestMethod.Delete));
            // method decorator
            exports_1("HEAD", HEAD = buildMethodDeco(http_1.RequestMethod.Head));
            // method decorator
            exports_1("OPTIONS", OPTIONS = buildMethodDeco(http_1.RequestMethod.Options));
        }
    }
});
//# sourceMappingURL=index.js.map