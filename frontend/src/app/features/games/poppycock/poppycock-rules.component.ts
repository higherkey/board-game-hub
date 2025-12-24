import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poppycock-rules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rules-container p-4 rounded-4 shadow-lg text-white">
      <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <h2 class="display-6 fw-bold text-accent mb-0">How to Play Poppycock</h2>
        <button class="btn-close btn-close-white" (click)="close.emit()"></button>
      </div>

      <div class="rules-content">
        <section class="mb-4">
          <h4 class="text-primary mb-3">
            <i class="bi bi-pencil-square me-2"></i>1. The Bluff
          </h4>
          <p>The system presents an obscure word, law, or title. Unless you are the <strong>Dasher</strong>, your goal is to write a definition that sounds so convincing it fools other players.</p>
        </section>

        <section class="mb-4">
          <h4 class="text-primary mb-3">
            <i class="bi bi-check2-circle me-2"></i>2. The Vote
          </h4>
          <p>All definitions (yours, others, and the real one) are shuffled. You must find the <strong>Truth</strong> among the lies.</p>
        </section>

        <section class="mb-4">
          <h4 class="text-primary mb-3">
            <i class="bi bi-trophy me-2"></i>3. Scoring
          </h4>
          <div class="table-responsive">
            <table class="table table-borderless text-white mb-0">
              <tbody>
                <tr>
                  <td class="ps-0 py-1"><span class="badge bg-success">+3 pts</span></td>
                  <td class="py-1">You voted for the <strong>Real Definition</strong>.</td>
                </tr>
                <tr>
                  <td class="ps-0 py-1"><span class="badge bg-primary">+2 pts</span></td>
                  <td class="py-1">A player voted for <strong>Your Bluff</strong>.</td>
                </tr>
                <tr>
                  <td class="ps-0 py-1"><span class="badge bg-warning text-dark">+3 pts</span></td>
                  <td class="py-1"><strong>Dasher Bonus</strong>: No one guessed the real answer.</td>
                </tr>
                <tr>
                  <td class="ps-0 py-1"><span class="badge bg-info text-dark">+3 pts</span></td>
                  <td class="py-1"><strong>The Natural</strong>: You wrote the real answer yourself!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="text-center mt-4">
          <button class="btn btn-accent btn-lg px-5 fw-bold shadow-sm" (click)="close.emit()">
            Let's Play!
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rules-container {
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 600px;
      margin: 0 auto;
    }
    .text-accent { color: #f59e0b; }
    .btn-accent {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      transition: all 0.2s;
    }
    .btn-accent:hover {
      background: #fbbf24;
      transform: translateY(-2px);
    }
    .badge { width: 60px; }
  `]
})
export class PoppycockRulesComponent {
  @Output() close = new EventEmitter<void>();
}
