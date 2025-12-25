import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-end-round-button',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button class="btn-end-round" (click)="handleClick()" [disabled]="disabled">
      <i class="bi bi-stop-circle-fill me-2"></i> {{ label }}
    </button>
  `,
    styles: [`
    .btn-end-round {
      background: rgba(220, 53, 69, 0.15);
      color: #ff6b6b;
      border: 1px solid rgba(220, 53, 69, 0.3);
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      backdrop-filter: blur(5px);

      &:hover:not(:disabled) {
        background: rgba(220, 53, 69, 0.25);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
        color: #ff8787;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(0.5);
      }
    }
  `]
})
export class EndRoundButtonComponent {
    @Input() disabled = false;
    @Input() label = 'END ROUND';
    @Output() endRound = new EventEmitter<void>();

    handleClick() {
        this.endRound.emit();
    }
}
