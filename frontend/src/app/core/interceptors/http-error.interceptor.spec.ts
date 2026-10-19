import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { httpErrorInterceptor } from './http-error.interceptor';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { LoggerService } from '../services/logger.service';

describe('httpErrorInterceptor', () => {
    let httpClient: HttpClient;
    let httpMock: HttpTestingController;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let router: Router;
    let toastServiceSpy: jasmine.SpyObj<ToastService>;
    let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
        toastServiceSpy = jasmine.createSpyObj('ToastService', ['showError']);
        loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['error']);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([httpErrorInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy },
                { provide: LoggerService, useValue: loggerServiceSpy }
            ]
        });

        httpClient = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);
        spyOn(router, 'navigate');
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should pass through successful requests untouched', () => {
        const testData = { success: true };

        httpClient.get('/api/test').subscribe(res => {
            expect(res).toEqual(testData);
        });

        const req = httpMock.expectOne('/api/test');
        req.flush(testData);

        expect(authServiceSpy.logout).not.toHaveBeenCalled();
        expect(toastServiceSpy.showError).not.toHaveBeenCalled();
    });

    it('should logout, toast error, and redirect to /login on 401 for non-auth endpoints', () => {
        httpClient.get('/api/protected-resource').subscribe({
            next: () => fail('expected error'),
            error: (err) => {
                expect(err.status).toBe(401);
            }
        });

        const req = httpMock.expectOne('/api/protected-resource');
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.logout).toHaveBeenCalled();
        expect(toastServiceSpy.showError).toHaveBeenCalledWith('Session expired. Please log in again.');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should NOT logout or redirect on 401 when calling /api/auth/login', () => {
        httpClient.post('/api/auth/login', {}).subscribe({
            next: () => fail('expected error'),
            error: (err) => {
                expect(err.status).toBe(401);
            }
        });

        const req = httpMock.expectOne('/api/auth/login');
        req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should NOT logout or redirect on 401 when calling /api/auth/register', () => {
        httpClient.post('/api/auth/register', {}).subscribe({
            next: () => fail('expected error'),
            error: (err) => {
                expect(err.status).toBe(401);
            }
        });

        const req = httpMock.expectOne('/api/auth/register');
        req.flush({ message: 'Unauthorized register' }, { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should show permission toast and redirect to / on 403', () => {
        httpClient.get('/api/admin-only').subscribe({
            next: () => fail('expected error'),
            error: (err) => {
                expect(err.status).toBe(403);
            }
        });

        const req = httpMock.expectOne('/api/admin-only');
        req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

        expect(authServiceSpy.logout).not.toHaveBeenCalled();
        expect(toastServiceSpy.showError).toHaveBeenCalledWith('You do not have permission to perform this action.');
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should log error and show server error toast on 500 error', () => {
        httpClient.get('/api/server-break').subscribe({
            next: () => fail('expected error'),
            error: (err) => {
                expect(err.status).toBe(500);
            }
        });

        const req = httpMock.expectOne('/api/server-break');
        req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

        expect(loggerServiceSpy.error).toHaveBeenCalled();
        expect(toastServiceSpy.showError).toHaveBeenCalledWith('A server error occurred. Please try again later.');
    });

    it('should log error and show server error toast on 503 error', () => {
        httpClient.get('/api/service-unavailable').subscribe({
            next: () => fail('expected error'),
            error: (err) => {
                expect(err.status).toBe(503);
            }
        });

        const req = httpMock.expectOne('/api/service-unavailable');
        req.flush({ message: 'Service Unavailable' }, { status: 503, statusText: 'Service Unavailable' });

        expect(loggerServiceSpy.error).toHaveBeenCalled();
        expect(toastServiceSpy.showError).toHaveBeenCalledWith('A server error occurred. Please try again later.');
    });
});
