import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { LoggerService } from '../services/logger.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);
    const logger = inject(LoggerService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Exclude authentication endpoints so invalid login credentials don't trigger global session logout
            const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

            if (error.status === 401 && !isAuthEndpoint) {
                authService.logout();
                toastService.showError('Session expired. Please log in again.');
                router.navigate(['/login']);
            } else if (error.status === 403) {
                toastService.showError('You do not have permission to perform this action.');
                router.navigate(['/']);
            } else if (error.status >= 500) {
                logger.error(`[HTTP ${error.status}] ${req.method} ${req.urlWithParams}`, error.message);
                toastService.showError('A server error occurred. Please try again later.');
            }

            return throwError(() => error);
        })
    );
};
