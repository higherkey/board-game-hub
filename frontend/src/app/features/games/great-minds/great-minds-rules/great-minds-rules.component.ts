import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-great-minds-rules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rules-overlay" (click)="closeRules.emit()">
      <div class="rules-card" (click)="$event.stopPropagation()">
        <header>
          <h2>THE DISCIPLINE OF SYNC</h2>
          <button class="close-btn" (click)="closeRules.emit()">&times;</button>
        </header>

        <div class="rules-content">
          <section>
            <h3>1. The Goal</h3>
            <p>Work together to play all cards in the deck in <strong>ascending order</strong> (1 to 100). You win by completing all 12 levels.</p>
          </section>

          <section>
            <h3>2. Absolute Silence</h3>
            <p>No speaking. No gestures. No signals. The only communication is the <strong>passage of time</strong>.</p>
          </section>

          <section>
            <h3>3. The Flow</h3>
            <p>There are no turns. When you feel the time is right, tap your card to play it. If you have a low number, you must act sooner than those with high numbers.</p>
          </section>

          <section>
            <h3>4. The Cost of Haste</h3>
            <p>If someone plays a card while you hold a <strong>lower number</strong>, the connection breaks. You lose a <strong>Life</strong> and all missed cards are discarded.</p>
          </section>

          <section>
            <h3>5. Sync Tokens</h3>
            <p>Use Sync Tokens to realign. Everyone discards their lowest card, giving the team fresh information.</p>
          </section>

          <div class="reward-hint">
              ✨ Complete Levels 3, 6, and 9 to earn extra Lives and Sync Tokens.
          </div>
        </div>

        <footer>
          <button class="understand-btn" (click)="closeRules.emit()">I AM READY</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .rules-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .rules-card {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      width: 90%;
      max-width: 500px;
      border-radius: 24px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h2 {
      margin: 0;
      font-size: 1.25rem;
      letter-spacing: 0.2em;
      font-weight: 300;
      color: #94a3b8;
    }

    .close-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 2rem;
      cursor: pointer;
      transition: color 0.2s;
    }

    .close-btn:hover { color: white; }

    .rules-content {
      max-height: 50vh;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    section {
      margin-bottom: 1.5rem;
    }

    h3 {
      font-size: 1rem;
      color: #38bdf8;
      margin-bottom: 0.5rem;
    }

    p {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0;
    }

    .reward-hint {
        margin-top: 2rem;
        padding: 1rem;
        background: rgba(56, 189, 248, 0.1);
        border-radius: 12px;
        font-size: 0.9rem;
        text-align: center;
        color: #7dd3fc;
    }

    footer {
      margin-top: 2rem;
      display: flex;
      justify-content: center;
    }

    .understand-btn {
      background: #38bdf8;
      color: #0f172a;
      border: none;
      padding: 1rem 3rem;
      border-radius: 9999px;
      font-weight: 600;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: all 0.2s;
    }

    .understand-btn:hover {
      background: #7dd3fc;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(56, 189, 248, 0.4);
    }
  `]
})
export class GreatMindsRulesComponent {
  @Output() closeRules = new EventEmitter<void>();
}
