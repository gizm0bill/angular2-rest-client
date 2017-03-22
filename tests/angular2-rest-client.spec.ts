import { inject, TestBed, async, fakeAsync, tick } from '@angular/core/testing';
import { BaseRequestOptions, Http, ConnectionBackend, RequestMethod, Response,
  ResponseOptions, URLSearchParams, ResponseContentType, Headers as NgHeaders } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// Load the implementations that should be tested
import
{
  AbstractApiClient,
  BaseUrl, Headers, Error as ApiError,
  Body, Path, Query, Header, Type,
  GET, POST, PUT, DELETE, HEAD, OPTIONS,
  NO_ENCODE, standardEncoding, PassThroughQueryEncoder
} from '../src/angular2-rest-client';

describe('api', () =>
{
  const
  BASE_URL            = '/test-base-url/',
  GET_URL             = 'test-get',
  POST_URL            = 'test-post',
  PUT_URL             = 'test-put',
  DELETE_URL          = 'test-delete',
  HEAD_URL            = 'test-head',
  OPTIONS_URL         = 'test-options',
  HEADER_CLASS_VALUE  = 'test-class-header-value',
  HEADER_METHOD_VALUE = 'test-method-header-value',
  HEADER_PARAM_VALUE  = 'test-param-header-value',
  PATH_PARAM_VALUE    = 'test-path',
  PATH_PARAM_VALUE2   = 'test-path2',
  PATH_PARAM_URL      = 'some/{testPathParam}',
  ERROR               = new Error('test-error'),
  CONFIG_JSON         = 'test-config-location.json';

  // our test subject
  @BaseUrl(BASE_URL)
  @Headers({ testClassHeader: HEADER_CLASS_VALUE })
  @ApiError( (err, caught): Observable<string> => Observable.throw(ERROR) )
  class ApiClient extends AbstractApiClient
  {
    constructor( protected http: Http ) { super(http); }

    @GET(GET_URL) public testGet(): Observable<Response> { return }

    @POST(POST_URL) public testPost(): Observable<Response> { return }

    @PUT(PUT_URL) public testPut(): Observable<Response> { return }

    @DELETE(DELETE_URL) public testDelete(): Observable<Response> { return }

    @HEAD(HEAD_URL) public testHead(): Observable<Response> { return }

    @OPTIONS(OPTIONS_URL) public testOptions(): Observable<Response> { return }

    @HEAD()
    @Headers({ testMethodHeader: HEADER_METHOD_VALUE, testMethodHeader1: HEADER_METHOD_VALUE })
    public testHeader( @Header('testParamHeader') testHeaderValue: string ): Observable<Response> { return }

    @HEAD() public testBody(  @Body('testBodyParam') testBodyValueKey: File, 
                              @Body() testBodyValueNoKey: File,
                              @Body('testBodyParamAny') testBodyParamAny: any,
                              @Body() testBodyParamAnyNoKey: any ): Observable<Response> { return }

    @HEAD() public testQuery( @Query('testQuery[Param]') testQueryValue: string, 
      @Query('testQueryParam[NotEncoded]', NO_ENCODE) testQueryValueNotEncoded: string ): Observable<Response> { return }

    @HEAD(PATH_PARAM_URL) 
    public testPath( @Path('testPathParam') testPathValue: string ): Observable<Response> { return }

    @GET() @Type(ResponseContentType.Blob)
    public testType(): Observable<Response> { return }

    @HEAD() public testError(): Observable<Response> { return }
    
  }

  // for testing BaseUrl from config file
  @BaseUrl(CONFIG_JSON, 'base-url')
  class ApiClient2 extends AbstractApiClient
  {
    constructor( private _http: Http ) { super(_http); }
    @HEAD() public testBaseUrl(): Observable<Response> { return }

    @Headers({ testMethodHeader: HEADER_METHOD_VALUE }) // for the sake of coverage
    public testMethodHeaderFirst(): Observable<Response> { return }
  }

  // for testing BaseUrl from Function
  @BaseUrl(function(){ return this.http.get(CONFIG_JSON).map( (r: Response) => r.json()['base-url'] ) })
  class ApiClient3 extends AbstractApiClient
  {
    constructor( private _http: Http ) { super(_http); }
    @HEAD() public testBaseUrl(): Observable<Response> { return } 
  }
  // for testing missing Http
  class ApiClient0 extends AbstractApiClient{ @HEAD() public testError(): Observable<Response> { return } }
  // for testing without BaseUrl
  class ApiClient00 extends AbstractApiClient{ @HEAD() public testNothing(): Observable<Response> { return } }
  // --- test subject

  let

  apiClient: ApiClient,
  apiClient2: ApiClient2,
  apiClient3: ApiClient3,
  apiClient0: ApiClient0,
  apiClient00: ApiClient00,
  mockBackend: MockBackend,
  http: Http;

  const
  expectRequestMethod = ( reqMethod: RequestMethod ): Observable<any> =>
  {
    return mockBackend.connections.map( (conn: MockConnection) => { expect(conn.request.method).toEqual(reqMethod); return conn; });
  };
  beforeEach(() => TestBed.configureTestingModule
  ({
    providers:
    [
      BaseRequestOptions,
      MockBackend,
      {
        provide: Http,
        useFactory: (backend: ConnectionBackend, defaultOptions: BaseRequestOptions) => new Http(backend, defaultOptions),
        deps: [MockBackend, BaseRequestOptions],
      },
      { provide: ApiClient, useFactory: (http: Http) => new ApiClient(http), deps: [Http] },
      { provide: ApiClient2, useFactory: (http: Http) => new ApiClient2(http), deps: [Http] },
      { provide: ApiClient3, useFactory: (http: Http) => new ApiClient3(http), deps: [Http] },
      { provide: ApiClient0, useFactory: () => new ApiClient0(undefined) }, // no Http for this one
      { provide: ApiClient00, useFactory: (http: Http) => new ApiClient00(http), deps: [Http] },
    ],
   }));

  beforeEach( inject( [ApiClient, ApiClient2, ApiClient3, ApiClient0, ApiClient00, MockBackend, Http], 
    (client, client2, client3, client0, client00, mock, http) =>
    {
      [ apiClient, apiClient2, apiClient3, apiClient0, apiClient00 ] = [ client, client2, client3, client0, client00 ];
      mockBackend = mock; http = http
    }));

  it('throws error if missing Http', async(()=>
  {
    expect( () => apiClient0.testError() ).toThrowError()
  }));

  it('catches Error', async( () =>
  {
    mockBackend.connections.subscribe( (conn: MockConnection) => 
    {
      conn.mockError(new Error);
    })
    apiClient.testError().subscribe(_=>_, err => expect(err).toEqual(ERROR));
  }));

  it('works without BaseUrl ', async(() =>
  {
    mockBackend.connections.subscribe( (conn: MockConnection) => expect(conn.request.url).toEqual('') );
    apiClient00.testNothing().subscribe();
  }));

  it('adds BaseUrl ', async(() =>
  {
    mockBackend.connections.subscribe( (conn: MockConnection) => expect(conn.request.url).toEqual(BASE_URL + HEAD_URL) );
    apiClient.testHead().subscribe();
  }));

  it('adds BaseUrl from config.json', async( () =>
  {
    // TODO: can't really test cache since MockConnection implements a ReplaySubject as response...
    // test cache
    // let requestedConfigXTimes = 0;
    mockBackend.connections.subscribe( (conn: MockConnection) =>
    {
      if ( conn.request.url === CONFIG_JSON )
      {
        conn.mockRespond( new Response( new ResponseOptions({ body: JSON.stringify({'base-url': 'some-value'}), status: 200 }) ));
        // requestedConfigXTimes++;
        return
      }
      expect(conn.request.url).toEqual('some-value');
      conn.mockRespond( new Response( new ResponseOptions({ body: JSON.stringify({}), status: 200 }) ));
    });
    apiClient2.testBaseUrl().subscribe();
    // test cache
    // apiClient2.testBaseUrl().subscribe( _ => expect(requestedConfigXTimes).toBe(1) );
  }));

  it('adds BaseUrl from Function', async(() =>
  {
    mockBackend.connections.subscribe( (conn: MockConnection) =>
    {
      if ( conn.request.url === CONFIG_JSON )
      {
        conn.mockRespond( new Response( new ResponseOptions({ body: JSON.stringify({'base-url': 'some-value'}), status: 200 }) ));
        return
      }
      expect(conn.request.url).toEqual('some-value');
      conn.mockRespond( new Response( new ResponseOptions({ body: JSON.stringify({}), status: 200 }) ));
    });
    apiClient3.testBaseUrl().subscribe();
  }));

  it('adds Headers', async( () =>
  {
    const expectedHeaders = new NgHeaders
    ({
      testMethodHeader: HEADER_METHOD_VALUE,
      testMethodHeader1: HEADER_METHOD_VALUE,
      testParamHeader:  HEADER_PARAM_VALUE,
      testClassHeader:  HEADER_CLASS_VALUE,
    });
    mockBackend.connections
      .subscribe( (conn: MockConnection) =>
      {
        // need to transform them to lowercase since Angular2.0.2
        let jsonExpectedHeaders = expectedHeaders.toJSON();
        expect( conn.request.headers.toJSON() ).toEqual( jasmine.objectContaining(jsonExpectedHeaders) );
      });
    apiClient.testHeader( HEADER_PARAM_VALUE ).subscribe();
  }));

  it('adds Body', async( () =>
  {
    const mockData = ['mock', '-', 'data'],
          mockFilename = 'mock-filename';
    // conn.request.contentType
    mockBackend.connections.subscribe( (conn: MockConnection) =>
    {
      let bodyNamedFile: File = conn.request.getBody().getAll('testBodyParam')[0],
          bodyUnnamedFile: File = conn.request.getBody().getAll('files[]')[0],
          bodyNamedParam: any =  conn.request.getBody().getAll('testBodyParamAny')[0],
          bodyUnnamedParam: any =  conn.request.getBody().getAll('params[]')[0];

      expect( bodyNamedFile.name ).toBe(mockFilename);
      let reader = new FileReader;
      reader.onload = (e: ProgressEvent) => { expect( (<any>e.target).result ).toEqual(mockData.join('')); };
      reader.readAsText(bodyNamedFile);
    });
    
    const file1 = new File( mockData, mockFilename, {type: 'text/plain'} ),
          file2 = new File( mockData, mockFilename, {type: 'text/plain'} ),
          param1 = mockData,
          param2 = mockData;

    apiClient.testBody( file1, file2, param1, param2 ).subscribe();
  }));

  it('adds Query', async( () =>
  {
    let query = new URLSearchParams('', new PassThroughQueryEncoder() );
    // order counts apparently
    query.set( 'testQueryParam[NotEncoded]', 'some[other][value]' );
    query.set( standardEncoding('testQuery[Param]'), standardEncoding('some[value]') );
    let expectedURL = BASE_URL + '?' + query.toString();
    mockBackend.connections.subscribe( (conn: MockConnection) =>  expect(conn.request.url).toEqual(expectedURL) );
    apiClient.testQuery('some[value]', 'some[other][value]').subscribe();
  }));

  it('adds Path', async( () =>
  {
    const expectedURL = BASE_URL + PATH_PARAM_URL.replace(/\{testPathParam\}/, PATH_PARAM_VALUE);
    mockBackend.connections.subscribe( (conn: MockConnection) =>
    {
      expect(conn.request.url).toEqual(expectedURL);
    });
    apiClient.testPath(PATH_PARAM_VALUE).subscribe();
  }));

  it('adds a different Path', async( () =>
  {
    const prevURL = BASE_URL + PATH_PARAM_URL.replace(/\{testPathParam\}/, PATH_PARAM_VALUE);
    const expectedURL = BASE_URL + PATH_PARAM_URL.replace(/\{testPathParam\}/, PATH_PARAM_VALUE2);
    mockBackend.connections.subscribe( (conn: MockConnection) =>
    {
      expect(conn.request.url).toEqual(expectedURL);
      expect(conn.request.url).not.toEqual(prevURL);
    });
    apiClient.testPath(PATH_PARAM_VALUE2).subscribe();
  }));

  it('does GET request', async(() =>
  {
    expectRequestMethod(RequestMethod.Get).subscribe();
    apiClient.testGet().subscribe();
  }));

  it('does POST request', async(() =>
  {
    expectRequestMethod(RequestMethod.Post).subscribe();
    apiClient.testPost().subscribe();
  }));

  it('does PUT request', async(() =>
  {
    expectRequestMethod(RequestMethod.Put).subscribe();
    apiClient.testPut().subscribe();
  }));

  it('does DELETE request', async(() =>
  {
    expectRequestMethod(RequestMethod.Delete).subscribe();
    apiClient.testDelete().subscribe();
  }));

  it('does HEAD request',  async(() =>
  {
    expectRequestMethod(RequestMethod.Head).subscribe();
    apiClient.testHead().subscribe();
  }));

  it('does OPTIONS request', async(() =>
  {
    expectRequestMethod(RequestMethod.Options).subscribe();
    apiClient.testOptions().subscribe();
  }));

  it('sets response content Type', async( () =>
  {
    const json = JSON.stringify({some: 'value'}, null, 2);
    mockBackend.connections.subscribe( (conn: MockConnection) =>
    {
      expect(conn.request.responseType).toBe(ResponseContentType.Blob);
      conn.mockRespond( new Response( new ResponseOptions({ body: new Blob([json], {type: 'application/json'}) })));
    })
    return apiClient.testType().subscribe( _ =>
    {
      let reader = new FileReader;
      reader.onload = (e: ProgressEvent) => { expect((<any>e.target).result).toBe(json) };
      reader.readAsBinaryString(_.blob());
    });
  }));

});
