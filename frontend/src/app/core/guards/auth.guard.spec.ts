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
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false)
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

    it('should return true when user is logged in', () => {
        mockAuthService.isLoggedIn.and.returnValue(true);

        const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        expect(result).toBeTrue();
    });

    it('should redirect to login when user is not logged in', () => {
        mockAuthService.isLoggedIn.and.returnValue(false);

        const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        expect(mockRouter.parseUrl).toHaveBeenCalledWith('/login');
        expect(result).toBe(mockUrlTree);
    });
});
