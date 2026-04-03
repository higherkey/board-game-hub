import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../../services/auth.service';

describe('adminGuard', () => {
    let mockAuthService: any;
    let mockRouter: any;

    const executeGuard = (...guardParameters: [ActivatedRouteSnapshot, RouterStateSnapshot]) =>
        TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

    beforeEach(() => {
        mockAuthService = {
            isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
            isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
        };
        mockRouter = {
            parseUrl: jasmine.createSpy('parseUrl').and.callFake((url: string) => url)
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter }
            ]
        });
    });

    it('should redirect to /login if not authenticated', () => {
        mockAuthService.isAuthenticated.and.returnValue(false);
        
        const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        
        expect(result as any).toBe('/login');
        expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });

    it('should redirect to / if authenticated but not an admin', () => {
        mockAuthService.isAuthenticated.and.returnValue(true);
        mockAuthService.isAdmin.and.returnValue(false);
        
        const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        
        expect(result as any).toBe('/');
        expect(mockAuthService.isAdmin).toHaveBeenCalled();
    });

    it('should return true if authenticated and an admin', () => {
        mockAuthService.isAuthenticated.and.returnValue(true);
        mockAuthService.isAdmin.and.returnValue(true);
        
        const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        
        expect(result).toBeTrue();
        expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
        expect(mockAuthService.isAdmin).toHaveBeenCalled();
    });
});
