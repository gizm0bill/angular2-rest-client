import { inject, TestBed, async } from '@angular/core/testing';
import { BaseRequestOptions, Http, ConnectionBackend, RequestMethod, Response,
  ResponseOptions, URLSearchParams, Headers as NgHeaders } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// Load the implementations that should be tested
import
{
  AbstractApiClient,
  BaseUrl, Headers,
  Body, Path, Query, Header,
  GET, POST, PUT, DELETE, HEAD, OPTIONS,
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
  HEADER_PARAM_VALUE  = 'test-param-header-value';

  // our test subject
  @BaseUrl(BASE_URL)
  @Headers({ MockClassHeader: HEADER_CLASS_VALUE })
  class ApiClient extends AbstractApiClient
  {
    constructor( private _http: Http ) { super(_http); }

    @GET(GET_URL)
    public testGet(): Observable<Response> { return; }

    @POST(POST_URL)
    public testPost(): Observable<Response> { return; }

    @PUT(PUT_URL)
    public testPut(): Observable<Response> { return; }

    @DELETE(DELETE_URL)
    public testDelete(): Observable<Response> { return; }

    @HEAD(HEAD_URL)
    public testHead(): Observable<Response> { return; }

    @OPTIONS(OPTIONS_URL)
    public testOptions(): Observable<Response> { return; }

    @HEAD()
    @Headers({ MockMethodHeader: HEADER_METHOD_VALUE })
    public testHeader( @Header('MockParamHeader') mockHeaderValue: string ): Observable<Response> { return; }

    @HEAD()
    public testBody( @Body('MockBody') mockBodyValue: File ): Observable<Response> { return; }

    @HEAD()
    public testQuery( @Query('mockQuery') mockQuery: string ): Observable<Response> { return; }
  }

  // for testing BaseUrl from config file
  @BaseUrl('mock-config-location.json', 'base-url')
  class ApiClient2 extends ApiClient
  {
    @HEAD()
    public testBaseUrl(): Observable<Response> { return; } ;
  }
  // --- test subject

  let

  apiClient: ApiClient,
  apiClient2: ApiClient2,
  mockBackend: MockBackend;

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
    ],
   }));

  beforeEach( inject([ApiClient, ApiClient2, MockBackend], (client, client2, mock) =>
  {
    apiClient = client;
    apiClient2 = client2;
    mockBackend = mock;
  }));

  it('adds BaseUrl ', async(() =>
  {
    mockBackend.connections.subscribe( (conn: MockConnection) => expect(conn.request.url).toEqual(BASE_URL + HEAD_URL) );
    apiClient.testHead().subscribe();
  }));

  it('adds BaseUrl from config.json', async( () =>
  {
    // test cache
    let requestedConfigXTimes = 0; 
    mockBackend.connections.subscribe( (conn: MockConnection) =>
    {
      if ( conn.request.url === 'mock-config-location.json' )
      {
        conn.mockRespond( new Response( new ResponseOptions({ body: JSON.stringify({'base-url': 'some-value'}), status: 200 }) ));
        requestedConfigXTimes++;
        return;
      }
      expect(conn.request.url).toEqual('some-value');
      conn.mockRespond( new Response( new ResponseOptions({ body: JSON.stringify({}), status: 200 }) ));
    });
    apiClient2.testBaseUrl().subscribe();
    // test cache
    apiClient2.testBaseUrl().subscribe( _ => expect(requestedConfigXTimes).toBe(1) );
  }));

  it('adds Headers', async( () =>
  {
    const expectedHeaders = new NgHeaders
    ({
      MockMethodHeader: HEADER_METHOD_VALUE,
      MockParamHeader:  HEADER_PARAM_VALUE,
      MockClassHeader:  HEADER_CLASS_VALUE,
    });
    mockBackend.connections
      .subscribe( (conn: MockConnection) =>
      {
        // need to transform them to lowercase since Angular2.0.2
        let jsonExpectedHeaders = expectedHeaders.toJSON();
        for ( let i of Object.keys(jsonExpectedHeaders).sort() )
          if ( jsonExpectedHeaders.hasOwnProperty(i) )
          {
            let val = jsonExpectedHeaders[i];
            delete jsonExpectedHeaders[i];
            jsonExpectedHeaders[i.toLowerCase()] = val;
          }
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
      let bodyFile: File = conn.request.getBody().getAll('MockBody')[0];
      expect( bodyFile.name ).toBe(mockFilename);
      let reader = new FileReader;
      reader.onload = (e: ProgressEvent) => { expect( (<any>e.target).result ).toEqual(mockData.join('')); };
      reader.readAsText(bodyFile);
     });
    apiClient.testBody(new File( mockData, mockFilename, {type: 'text/plain'} )).subscribe();
  }));

  it('adds Query', async( () =>
  {
    let query = new URLSearchParams;
    query.set( encodeURIComponent('mockQuery'), encodeURIComponent('some-value') );
    let expectedURL = BASE_URL + '?' + query.toString();
    mockBackend.connections.subscribe( (conn: MockConnection) => expect(conn.request.url).toEqual(expectedURL) );
    apiClient.testQuery('some-value').subscribe();
  }));

  it('does GET request', async(() =>
  {
    expectRequestMethod(RequestMethod.Get).subscribe();
    apiClient.testGet().subscribe();
  }));

  it('does POST request', () =>
  {
    expectRequestMethod(RequestMethod.Post).subscribe();
    apiClient.testPost().subscribe();
  });

  it('does PUT request', () =>
  {
    expectRequestMethod(RequestMethod.Put).subscribe();
    apiClient.testPut().subscribe();
  });

  it('does DELETE request', () =>
  {
    expectRequestMethod(RequestMethod.Delete).subscribe();
    apiClient.testDelete().subscribe();
  });

  it('does HEAD request', () =>
  {
    expectRequestMethod(RequestMethod.Head).subscribe();
    apiClient.testHead().subscribe();
  });

  it('does OPTIONS request', () =>
  {
    expectRequestMethod(RequestMethod.Options).subscribe();
    apiClient.testOptions().subscribe();
  });

});
