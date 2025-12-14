import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-great-minds-board',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="board-container" [ngClass]="{'glitch-effect': isError}">
      <!-- HUD -->
      <div class="hud">
        <div class="stat">
          <span class="label">LEVEL</span>
          <span class="value">{{ gameState?.currentLevel || 1 }}</span>
        </div>
        <div class="stat lives">
          <span class="label">LIVES</span>
          <div class="hearts">
            <span *ngFor="let l of [].constructor(gameState?.lives || 0)">❤️</span>
          </div>
        </div>
        <div class="stat syncs">
          <span class="label">SYNCS</span>
          <div class="stars">
            <span *ngFor="let s of [].constructor(gameState?.syncTokens || 0)">✨</span>
          </div>
        </div>
      </div>

      <!-- THE STACK -->
      <div class="stack-area">
        <div class="card-display" 
             [style.background]="getGradient(gameState?.topCard || 0)"
             [class.pulse]="justPlayed">
          <span class="card-number">{{ gameState?.topCard || 0 }}</span>
        </div>
        <div class="message" *ngIf="message">{{ message }}</div>
      </div>
    </div>
  `,
    styles: [`
    .board-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .hud {
      position: absolute;
      top: 20px;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-around;
      font-family: 'Courier New', monospace;
      text-transform: uppercase;
      letter-spacing: 2px;
      z-index: 10;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .stat.lives .hearts { font-size: 1.5rem; filter: drop-shadow(0 0 5px red); }
    .stat.syncs .stars { font-size: 1.5rem; filter: drop-shadow(0 0 5px gold); }

    .value {
      font-size: 2rem;
      font-weight: bold;
    }

    .stack-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .card-display {
      width: 250px;
      height: 350px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8rem;
      font-weight: 900;
      color: white;
      text-shadow: 0 4px 10px rgba(0,0,0,0.3);
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 4px solid rgba(255,255,255,0.2);
    }

    .card-display.pulse {
      transform: scale(1.1);
    }

    .message {
      margin-top: 2rem;
      font-size: 1.5rem;
      opacity: 0.8;
      min-height: 2rem;
    }

    .glitch-effect {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
      background-color: #300 !important;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `]
})
export class GreatMindsBoardComponent implements OnChanges {
    @Input() gameState: any;
    justPlayed: boolean = false;
    isError: boolean = false;
    message: string = '';

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameState'] && !changes['gameState'].firstChange) {
            const prev = changes['gameState'].previousValue;
            const curr = changes['gameState'].currentValue;

            if (!prev || !curr) return;

            // Detect Play
            if (curr.topCard !== prev.topCard && curr.topCard !== 0) {
                this.triggerPlayAnim();
            }

            // Detect Error (Life lost)
            if (curr.lives < prev.lives) {
                this.triggerErrorAnim();
            }

            // Detect Level Up
            if (curr.currentLevel > prev.currentLevel) {
                this.message = `LEVEL ${curr.currentLevel}`;
                setTimeout(() => this.message = '', 3000);
            }
        }
    }

    triggerPlayAnim() {
        this.justPlayed = true;
        setTimeout(() => this.justPlayed = false, 300);
    }

    triggerErrorAnim() {
        this.isError = true;
        this.message = "CONNECTION BROKEN";
        setTimeout(() => {
            this.isError = false;
            this.message = '';
        }, 1000);
    }

    getGradient(num: number): string {
        if (num === 0) return 'rgba(255,255,255,0.1)';
        // Map 1-100 to Hue
        // 1 = Blue (200), 50 = Purple (280), 100 = Pink (330)
        const hue = 200 + (num * 1.3);
        return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 40}, 80%, 40%))`;
    }
}
