import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = 'http://localhost:5109/api/auth'; // Hardcoded for dev as per project structure usually
    private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    private readonly tokenKey = 'auth_token';
    private readonly userKey = 'auth_user';
    private readonly expirationKey = 'auth_expires_at';
    private readonly guestNameKey = 'guest_name';

    constructor(private readonly http: HttpClient, private readonly router: Router) {
        this.loadStoredSession();
    }

    getGuestName(): string | null {
        return localStorage.getItem(this.guestNameKey);
    }

    setGuestName(name: string) {
        localStorage.setItem(this.guestNameKey, name);
    }

    private loadStoredSession() {
        const token = localStorage.getItem(this.tokenKey);
        const userStr = localStorage.getItem(this.userKey);
        const expiresAt = localStorage.getItem(this.expirationKey);

        if (token && userStr && expiresAt) {
            const now = Date.now();
            if (now < Number.parseInt(expiresAt)) {
                try {
                    this.currentUserSubject.next(JSON.parse(userStr));
                } catch {
                    this.clearSessionState();
                }
            } else {
                this.clearSessionState();
            }
        } else {
            // Cleanup partial data if any, but don't redirect
            this.clearSessionState();
        }
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data);
    }

    login(data: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
            tap(response => {
                localStorage.setItem(this.tokenKey, response.token);
                localStorage.setItem(this.userKey, JSON.stringify(response.user));

                // Set expiry to 2 hours from now (matching backend)
                const expiresAt = Date.now() + (2 * 60 * 60 * 1000);
                localStorage.setItem(this.expirationKey, expiresAt.toString());

                this.currentUserSubject.next(response.user);
            })
        );
    }

    logout() {
        this.clearSessionState();
        this.router.navigate(['/login']);
    }

    private clearSessionState() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.expirationKey);
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        const expiresAt = localStorage.getItem(this.expirationKey);

        if (!token || !expiresAt) return false;

        const isValid = Date.now() < Number.parseInt(expiresAt);
        if (!isValid) {
            this.logout();
            return false;
        }
        return true;
    }
}
