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

export interface Session {
    name: string;
    isGuest: boolean;
    avatarUrl?: string;
    email?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = '/api/auth'; // Relative path for tunnel compatibility
    private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private readonly sessionSubject = new BehaviorSubject<Session | null>(null);
    public session$ = this.sessionSubject.asObservable();

    get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    private readonly tokenKey = 'auth_token';
    private readonly userKey = 'auth_user';
    private readonly expirationKey = 'auth_expires_at';
    private readonly activityKey = 'auth_last_activity';
    private readonly staySignedInKey = 'auth_stay_signed_in';
    private readonly guestNameKey = 'guest_name';
    private readonly guestIdKey = 'guest_id';

    private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    private readonly DEFAULT_ABSOLUTE_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours
    private readonly LONG_ABSOLUTE_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 1 week

    constructor(private readonly http: HttpClient, private readonly router: Router) {
        this.loadStoredSession();
        this.setupActivityListeners();
        this.updateSession();
    }

    private setupActivityListeners() {
        // Listen for user interaction to extend sliding session
        const events = ['mousedown', 'keydown', 'touchstart'];
        events.forEach(event => {
            globalThis.addEventListener(event, () => this.recordActivity());
        });
    }

    public recordActivity() {
        const now = Date.now();
        const last = localStorage.getItem(this.activityKey);

        // Throttle updates to once per minute to save on storage IO
        if (!last || now - Number.parseInt(last) > 60000) {
            localStorage.setItem(this.activityKey, now.toString());
        }
    }

    getGuestName(): string | null {
        return localStorage.getItem(this.guestNameKey);
    }

    getGuestId(): string {
        let id = localStorage.getItem(this.guestIdKey);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(this.guestIdKey, id);
        }
        this.refreshGuestSession();
        return id;
    }

    setGuestName(name: string) {
        localStorage.setItem(this.guestNameKey, name);
        this.refreshGuestSession();
        this.updateSession();
    }

    refreshGuestSession() {
        // We use the same central activity and expiration keys for guests now
        this.recordActivity();

        // Ensure guests also have an absolute expiration set
        if (!localStorage.getItem(this.expirationKey)) {
            const expiresAt = Date.now() + this.DEFAULT_ABSOLUTE_TIMEOUT;
            localStorage.setItem(this.expirationKey, expiresAt.toString());
        }
    }

    private updateSession() {
        const user = this.currentUserSubject.value;
        if (user) {
            this.sessionSubject.next({
                name: user.displayName,
                isGuest: false,
                avatarUrl: user.avatarUrl,
                email: user.email
            });
            return;
        }

        const guestName = this.getGuestName();
        if (guestName) {
            this.sessionSubject.next({
                name: guestName,
                isGuest: true
            });
            return;
        }

        this.sessionSubject.next(null);
    }

    getUserIdOrGuestId(): string {
        const user = this.currentUserValue;
        if (user) return user.id;
        return this.getGuestId();
    }

    private loadStoredSession() {
        const token = localStorage.getItem(this.tokenKey);
        const userStr = localStorage.getItem(this.userKey);
        const guestId = localStorage.getItem(this.guestIdKey);

        if (token || guestId) {
            if (this.isAuthenticated()) {
                if (userStr) {
                    try {
                        this.currentUserSubject.next(JSON.parse(userStr));
                    } catch {
                        this.logout();
                    }
                }
            } else {
                this.logout();
            }
        }
    }

    private clearGuestSession() {
        localStorage.removeItem(this.guestNameKey);
        localStorage.removeItem(this.guestIdKey);
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data);
    }

    login(data: any, staySignedInLonger: boolean = false): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
            tap(response => {
                localStorage.setItem(this.tokenKey, response.token);
                localStorage.setItem(this.userKey, JSON.stringify(response.user));

                const absoluteTimeout = staySignedInLonger ? this.LONG_ABSOLUTE_TIMEOUT : this.DEFAULT_ABSOLUTE_TIMEOUT;
                const expiresAt = Date.now() + absoluteTimeout;
                localStorage.setItem(this.expirationKey, expiresAt.toString());
                localStorage.setItem(this.activityKey, Date.now().toString());
                localStorage.setItem(this.staySignedInKey, staySignedInLonger.toString());

                this.currentUserSubject.next(response.user);
                this.updateSession();
            })
        );
    }

    logout() {
        this.clearSessionState();
        this.updateSession();
        this.router.navigate(['/login']);
    }

    private clearSessionState() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.expirationKey);
        localStorage.removeItem(this.activityKey);
        localStorage.removeItem(this.staySignedInKey);
        this.clearGuestSession();
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        const guestId = localStorage.getItem(this.guestIdKey);

        if (!token && !guestId) return false;

        const expiresAt = localStorage.getItem(this.expirationKey) || (Date.now() + this.DEFAULT_ABSOLUTE_TIMEOUT).toString();
        const lastActivity = localStorage.getItem(this.activityKey);

        const now = Date.now();

        // 1. Check Absolute Timeout
        if (now > Number.parseInt(expiresAt)) {
            console.warn('Session expired (Absolute timeout)');
            this.logout();
            return false;
        }

        // 2. Check Inactivity Timeout (Sliding)
        // Skip inactivity check if user chose to stay signed in longer
        const staySignedIn = localStorage.getItem(this.staySignedInKey) === 'true';
        if (!staySignedIn && lastActivity && now - Number.parseInt(lastActivity) > this.INACTIVITY_TIMEOUT) {
            console.warn('Session expired (Inactivity timeout)');
            this.logout();
            return false;
        }

        return true;
    }
}
