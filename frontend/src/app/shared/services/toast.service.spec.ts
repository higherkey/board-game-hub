import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

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

    it('should add a toast when show() is called', () => {
        service.show('Test message', 'success');
        service.toasts$.subscribe(toasts => {
            expect(toasts.length).toBe(1);
            expect(toasts[0].message).toBe('Test message');
            expect(toasts[0].type).toBe('success');
        });
    });

    it('should show success toast', () => {
        service.showSuccess('Success!');
        service.toasts$.subscribe(toasts => {
            expect(toasts[0].type).toBe('success');
        });
    });

    it('should show error toast with 5000ms duration', () => {
        service.showError('Error!');
        service.toasts$.subscribe(toasts => {
            expect(toasts[0].type).toBe('error');
            expect(toasts[0].duration).toBe(5000);
        });
    });

    it('should remove toast after duration', fakeAsync(() => {
        service.show('Temporary', 'info', 1000);
        let currentToasts: Toast[] = [];
        service.toasts$.subscribe(t => currentToasts = t);
        
        expect(currentToasts.length).toBe(1);
        tick(1000);
        expect(currentToasts.length).toBe(0);
    }));

    it('should remove toast manually', () => {
        service.show('Manual', 'info', 0);
        let currentToasts: Toast[] = [];
        service.toasts$.subscribe(t => currentToasts = t);
        
        const id = currentToasts[0].id;
        service.remove(id);
        expect(currentToasts.length).toBe(0);
    });
});
