import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100; pointer-events: none;">
      <div *ngFor="let toast of toastService.toasts$ | async" 
           class="toast show align-items-center text-white border-0 mb-2 shadow-lg" 
           [ngClass]="{
             'bg-success': toast.type === 'success',
             'bg-danger': toast.type === 'error',
             'bg-info': toast.type === 'info',
             'bg-warning': toast.type === 'warning'
           }"
           role="alert" aria-live="assertive" aria-atomic="true"
           style="pointer-events: auto;"
           [@slideInOut]>
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <i class="bi" [ngClass]="{
                'bi-check-circle-fill': toast.type === 'success',
                'bi-exclamation-circle-fill': toast.type === 'error',
                'bi-info-circle-fill': toast.type === 'info',
                'bi-exclamation-triangle-fill': toast.type === 'warning'
            }"></i>
            {{ toast.message }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close" (click)="remove(toast.id)"></button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .toast-container {
        pointer-events: none;
    }
  `],
    animations: [
        trigger('slideInOut', [
            transition(':enter', [
                style({ transform: 'translateX(100%)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class ToastComponent {
    constructor(public toastService: ToastService) { }

    remove(id: number) {
        this.toastService.remove(id);
    }
}
