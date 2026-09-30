import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../../services/auth.service';

describe('authGuard', () => {
    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => authGuard(...guardParameters));

    let mockAuthService: any;
    let mockRouter: any;
    let mockUrlTree: UrlTree;

    beforeEach(() => {
        mockUrlTree = {} as UrlTree;
        mockAuthService = {
            isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false)
        };
        mockRouter = {
            parseUrl: jasmine.createSpy('parseUrl').and.returnValue(mockUrlTree)
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter }
            ]
        });
    });

    afterEach(() => {
        // Reset global port check if possible, but globalThis is hard to mock safely in JSDOM/Karma without side effects.
        // The guard uses globalThis.location.port. We should try to mock it if we want to test that branch.
        // However, location is often read-only.
    });

    it('should return true when user is authenticated', () => {
        mockAuthService.isAuthenticated.and.returnValue(true);

        const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        expect(result).toBeTrue();
    });

    it('should redirect to login when user is not authenticated', () => {
        mockAuthService.isAuthenticated.and.returnValue(false);

        const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        expect(mockRouter.parseUrl).toHaveBeenCalledWith('/login');
        expect(result).toBe(mockUrlTree);
    });
});
