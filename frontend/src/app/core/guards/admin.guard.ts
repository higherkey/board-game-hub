import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Check if authenticated
    if (!authService.isAuthenticated()) {
        console.warn('Admin access denied: Not authenticated. Redirecting to login.');
        return router.parseUrl('/login');
    }

    // 2. Check if Admin role exists
    if (authService.isAdmin()) {
        return true;
    }

    // 3. Authenticated but not an Admin
    console.warn('Admin access denied: Insufficient permissions. Redirecting to home.');
    return router.parseUrl('/');
};
