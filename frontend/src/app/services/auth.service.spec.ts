import { TestBed } from '@angular/core/testing';
import { AuthService, AuthResponse, User } from './auth.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let router: Router;

    const mockUser: User = { id: '1', email: 'test@test.com', displayName: 'Test User' };
    const mockAuthResponse: AuthResponse = { token: 'fake-jwt-token', user: mockUser };

    beforeEach(() => {
        // Clear storage before each test
        localStorage.clear();

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);
        spyOn(router, 'navigate');
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Login', () => {
        it('should POST to /login and store session', () => {
            service.login({ email: 'a', password: 'b' }).subscribe(response => {
                expect(response).toEqual(mockAuthResponse);
                expect(localStorage.getItem('auth_token')).toBe('fake-jwt-token');
                expect(service.getToken()).toBe('fake-jwt-token');
                expect(service.isAuthenticated()).toBeTrue();
            });

            const req = httpMock.expectOne('/api/auth/login');
            expect(req.request.method).toBe('POST');
            req.flush(mockAuthResponse);
        });
    });

    describe('Session Management', () => {
        it('should load session from localStorage on init', () => {
            localStorage.setItem('auth_token', 'stored-token');
            localStorage.setItem('auth_user', JSON.stringify(mockUser));

            // Re-inject to trigger constructor
            const newService = TestBed.inject(AuthService);

            newService.currentUser$.subscribe(user => {
                if (user) expect(user).toEqual(mockUser);
            });
            expect(newService.getToken()).toBe('stored-token');
        });

        it('should clear session on logout', () => {
            localStorage.setItem('auth_token', 'stored-token');
            service.logout();
            expect(localStorage.getItem('auth_token')).toBeNull();
            expect(router.navigate).toHaveBeenCalledWith(['/']);
        });
    });

    describe('Register', () => {
        it('should POST to /register', () => {
            service.register({}).subscribe();
            const req = httpMock.expectOne('/api/auth/register');
            expect(req.request.method).toBe('POST');
            req.flush({});
        });
    });
});
