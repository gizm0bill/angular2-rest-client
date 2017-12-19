# Angular2 REST Client
Angular2 REST Client inpsired by [angular2-rest](https://github.com/Paldom/angular2-rest)  
Tooling inspired by [angular2-webpack-starter](https://github.com/AngularClass/angular2-webpack-starter)

[![npm version](https://badge.fury.io/js/angular2-rest-client.svg)](https://badge.fury.io/js/angular2-rest-client)

## Installation
`npm install angular2-rest-client --save` / `yarn add angular2-rest-client --save` 

Uses deprecated `@angular/http`. Won't support `@angular/common/http` until it's stable and better documented.

## Example

```ts
// add base url from string
@BaseUrl('http://some.api/')
// add base url from json file
@BaseUrl('/config.json', 'base-url')
// add base url from function
// be sure to declare the function non-arrow style to have correct scope of this
@BaseUrl(function(){ return this.http.get('/config.json').map( (r: Response) => r.json()['base-url'] ) })
// only one of these per class 

// add some general headers
@Headers
({ 
  'X-Some-Common-Header': 'Some value', 
  'X-Some-Other-Common-Header': 'Some other value' 
})

// add custom error handler
@ApiError( (err, caught): Observable<string> => Observable.throw(new CustomError('BOOM!')) )

// you probably want to make this injectable
@Injectable()

// needst to extend AbstractApiClient
class ApiClient extends AbstractApiClient
{
  constructor( protected http: Http ) { super(http); }
  // specific method headers
  @Headers({ 'X-Some-Specific-Header': 'Some value' })
  // expected response content type
  @Type( ResponseContentType.Blob )
  // GET type request
  @GET('/resource/{id}')
  // add param to path: {id} is replaced by param value
  public read( @Path('Id') id: string ): Observable<Response> { return }

  // POST type request  
  @POST('/resource') 
  // add body fileds to the request
  public create( @Body('Name') name: string, @Body('Contents') file: File ): Observable<Response> { return }
  
  // PUT type request
  @PUT('/resource') 
  // add header from param to the request
  public update( @Header('X-Some-Author') author: number ): Observable<Response> { return }
  
  // DELETE type request
  @DELETE('/resource')
  // add query param: ?filter= 
  public delete( @Query('filter') filter: string ): Observable<Response> { return }
  
  // HEAD type request
  @HEAD('/resource') 
  public check(): Observable<Response> { return }
  
  // OPTIONS type request
  @OPTIONS('/resource') 
  public describe(): Observable<Response> { return }
}
```
## License

MIT
