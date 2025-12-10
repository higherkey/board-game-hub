import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
    id: string;
    email: string;
    displayName: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:5109/api/auth'; // Hardcoded for dev as per project structure usually
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private tokenKey = 'auth_token';
    private userKey = 'auth_user';

    constructor(private http: HttpClient, private router: Router) {
        this.loadStoredSession();
    }

    private loadStoredSession() {
        const token = localStorage.getItem(this.tokenKey);
        const userStr = localStorage.getItem(this.userKey);
        if (token && userStr) {
            try {
                this.currentUserSubject.next(JSON.parse(userStr));
            } catch {
                this.logout();
            }
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
                this.currentUserSubject.next(response.user);
            })
        );
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}
