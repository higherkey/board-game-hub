import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="options && options.position" 
         class="confirm-popover shadow-lg border-0 rounded-4 overflow-visible position-absolute"
         [style.top.px]="options.position.top - 10" 
         [style.left.px]="options.position.left + (options.position.width / 2)"
         style="transform: translate(-50%, -100%); z-index: 2000; width: 280px;">
      
      <div class="popover-beak"></div>

      <div class="modal-content-wrapper p-3 text-center">
        <div class="mb-2 fs-4" [ngClass]="options.iconClass || 'text-warning'">
          <i class="bi" [ngClass]="options.icon || 'bi-exclamation-triangle-fill'"></i>
        </div>
        <h6 class="fw-bold mb-1">{{ options.title || 'Are you sure?' }}</h6>
        <p class="text-secondary x-small mb-3">
          {{ options.message }}
        </p>
        
        <div class="d-flex flex-column gap-2">
            <button class="btn btn-sm fw-bold py-2" [ngClass]="options.confirmButtonClass || 'btn-primary'" (click)="confirm()">
                {{ options.confirmLabel || 'CONFIRM' }}
            </button>
            <button class="btn btn-sm btn-link text-secondary text-decoration-none x-small" (click)="cancel()">
                {{ options.cancelLabel || 'CANCEL' }}
            </button>
        </div>
      </div>
    </div>

    <!-- Backdrop to close on click outside -->
    <div *ngIf="options" class="popover-backdrop" (click)="cancel()"></div>
  `,
  styles: [`
    .confirm-popover {
      background: white;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
      animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .popover-beak {
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid white;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
    }

    .popover-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.05);
      z-index: 1999;
    }

    .x-small { font-size: 0.75rem; }

    @keyframes popIn {
      from { opacity: 0; transform: translate(-50%, -90%) scale(0.95); }
      to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
    }

    .modal-content-wrapper {
        background: white;
        border-radius: inherit;
    }

    .btn-primary {
        background: linear-gradient(135deg, #003366 0%, #1e1e2e 100%);
        border: none;
        box-shadow: 0 4px 15px rgba(0, 51, 102, 0.2);

        &:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
    }
  `]
})
export class AppConfirmComponent {
  @ViewChild('confirmDialog') dialog!: ElementRef<HTMLDialogElement>;
  options: ConfirmOptions | null = null;

  constructor(private confirmService: ConfirmService) {
    this.confirmService.register(this);
  }

  show(options: ConfirmOptions) {
    this.options = options;
    this.dialog.nativeElement.showModal();
  }

  confirm() {
    this.dialog.nativeElement.close();
    this.confirmService.resolve(true);
  }

  cancel() {
    this.dialog.nativeElement.close();
    this.confirmService.resolve(false);
  }
}
