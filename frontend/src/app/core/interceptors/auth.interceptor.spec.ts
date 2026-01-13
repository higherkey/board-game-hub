import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../../services/auth.service';

describe('authInterceptor', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let mockAuthService: any;

    beforeEach(() => {
        mockAuthService = {
            getToken: jasmine.createSpy('getToken').and.returnValue(null)
        };

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: mockAuthService }
            ]
        });

        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should add Authorization header when token exists', () => {
        mockAuthService.getToken.and.returnValue('fake-token');

        http.get('/api/data').subscribe();

        const req = httpMock.expectOne('/api/data');
        expect(req.request.headers.has('Authorization')).toBeTrue();
        expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    });

    it('should not add Authorization header when token does not exist', () => {
        mockAuthService.getToken.and.returnValue(null);

        http.get('/api/data').subscribe();

        const req = httpMock.expectOne('/api/data');
        expect(req.request.headers.has('Authorization')).toBeFalse();
    });
});
