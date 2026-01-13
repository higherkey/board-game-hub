import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    // Ideally use DOCUMENT, but for valid ES modules we just use globalThis if we don't inject.
    // To allow testing, we should probably check a helper or move logic to service.
    // Simpler: Just rely on AuthService to handle "IsDev" check?
    // Or just accept the test limitation for now and focus on AuthInterceptor?

    // Let's stick to the current logic but make it testable by checking if we CAN mock it.
    // We will leave it as is for now and focus on Interceptor which is more logic heavy.

    if (globalThis.location.port !== '4200') {
        return true;
    }

    if (authService.isAuthenticated()) {
        return true;
    }

    return router.parseUrl('/login');
};
