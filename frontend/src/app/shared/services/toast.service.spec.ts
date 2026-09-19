import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';
import { take } from 'rxjs/operators';

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ToastService]
        });
        service = TestBed.inject(ToastService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add a toast when show() is called', fakeAsync(() => {
        service.show('Test message', 'success', 1000);
        service.toasts$.pipe(take(1)).subscribe(toasts => {
            expect(toasts.length).toBe(1);
            expect(toasts[0].message).toBe('Test message');
            expect(toasts[0].type).toBe('success');
        });
        tick(1000);
    }));

    it('should show success toast', fakeAsync(() => {
        service.showSuccess('Success!');
        service.toasts$.pipe(take(1)).subscribe(toasts => {
            expect(toasts.length).toBe(1);
            expect(toasts[0].type).toBe('success');
        });
        tick(3000);
    }));

    it('should show error toast with 5000ms duration', fakeAsync(() => {
        service.showError('Error!');
        service.toasts$.pipe(take(1)).subscribe(toasts => {
            expect(toasts.length).toBe(1);
            expect(toasts[0].type).toBe('error');
            expect(toasts[0].duration).toBe(5000);
        });
        tick(5000);
    }));

    it('should show warning toast with 4000ms duration', fakeAsync(() => {
        service.showWarning('Warning!');
        service.toasts$.pipe(take(1)).subscribe(toasts => {
            expect(toasts.length).toBe(1);
            expect(toasts[0].type).toBe('warning');
            expect(toasts[0].duration).toBe(4000);
        });
        tick(4000);
    }));

    it('should show info toast with default 3000ms duration', fakeAsync(() => {
        service.showInfo('Info!');
        service.toasts$.pipe(take(1)).subscribe(toasts => {
            expect(toasts.length).toBe(1);
            expect(toasts[0].type).toBe('info');
            expect(toasts[0].duration).toBe(3000);
        });
        tick(3000);
    }));

    it('should remove toast after duration', fakeAsync(() => {
        service.show('Temporary', 'info', 1000);
        let currentToasts: Toast[] = [];
        const sub = service.toasts$.subscribe(t => currentToasts = t);
        
        expect(currentToasts.length).toBe(1);
        tick(1000);
        expect(currentToasts.length).toBe(0);
        sub.unsubscribe();
    }));

    it('should remove toast manually', () => {
        service.show('Manual', 'info', 0);
        let currentToasts: Toast[] = [];
        const sub = service.toasts$.subscribe(t => currentToasts = t);
        
        expect(currentToasts.length).toBe(1);
        const id = currentToasts[0].id;
        service.remove(id);
        expect(currentToasts.length).toBe(0);
        sub.unsubscribe();
    });
});

