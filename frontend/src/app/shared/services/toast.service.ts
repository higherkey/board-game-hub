import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastsSubject.asObservable();
    private counter = 0;

    constructor() { }

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3000) {
        const id = ++this.counter;
        const toast: Toast = { id, message, type, duration };

        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, toast]);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
    }

    showSuccess(message: string) {
        this.show(message, 'success');
    }

    showError(message: string) {
        this.show(message, 'error', 5000);
    }

    showInfo(message: string) {
        this.show(message, 'info');
    }

    showWarning(message: string) {
        this.show(message, 'warning', 4000);
    }

    remove(id: number) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
    }
}
