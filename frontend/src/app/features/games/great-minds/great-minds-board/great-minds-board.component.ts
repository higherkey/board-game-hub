import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-great-minds-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="board-container" [ngClass]="{'glitch-effect': isError, 'victory-state': isVictory}">
      <!-- ZEN BACKGROUND -->
      <div class="zen-bg"></div>
      
      <!-- HUD -->
      <div class="hud">
        <div class="stat">
          <span class="label">LEVEL</span>
          <span class="value">{{ gameState?.currentLevel || 1 }}</span>
        </div>
        <div class="stat lives">
          <span class="label">LIVES</span>
          <div class="hearts">
            <span *ngFor="let l of [].constructor(gameState?.lives || 0)" class="heart">❤️</span>
          </div>
        </div>
        <div class="stat syncs">
          <span class="label">SYNCS</span>
          <div class="stars">
            <span *ngFor="let s of [].constructor(gameState?.syncTokens || 0)" class="star">✨</span>
          </div>
        </div>
      </div>

      <!-- THE STACK -->
      <div class="stack-area">
        <div class="card-display" 
             [style.background]="getGradient(gameState?.topCard || 0)"
             [class.pulse]="justPlayed"
             [class.success-pop]="isSuccess">
          <span class="card-number">{{ gameState?.topCard || 0 }}</span>
          <div class="ripple" *ngIf="justPlayed"></div>
        </div>
        
        <div class="message-container">
          <div class="message" [class.show]="message">{{ message }}</div>
        </div>
      </div>

      <!-- REWARD OVERLAY -->
      <div class="reward-overlay" *ngIf="showReward">
          <div class="reward-flash">✨ REWARD GRANTED ✨</div>
          <div class="reward-detail">+1 LIFE & +1 SYNC</div>
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
      background: #0f172a;
    }

    .zen-bg {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.1), transparent 70%);
      pointer-events: none;
    }

    .hud {
      position: absolute;
      top: 2rem;
      width: 100%;
      display: flex;
      justify-content: space-around;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      letter-spacing: 4px;
      z-index: 10;
      color: #94a3b8;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .label { font-size: 0.75rem; opacity: 0.7; }
    .value { font-size: 2.5rem; font-weight: 300; color: white; }
    
    .heart, .star {
        display: inline-block;
        margin: 0 2px;
        filter: drop-shadow(0 0 8px rgba(255,255,255,0.3));
    }

    .stack-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3rem;
      z-index: 2;
    }

    .card-display {
      width: 280px;
      height: 400px;
      border-radius: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10rem;
      font-weight: 900;
      color: white;
      text-shadow: 0 10px 20px rgba(0,0,0,0.4);
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6), 
                  inset 0 0 0 1px rgba(255,255,255,0.1);
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }

    .ripple {
        position: absolute;
        top: 50%; left: 50%;
        width: 10px; height: 10px;
        background: white;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: rippleEffect 0.6s ease-out forwards;
    }

    @keyframes rippleEffect {
        from { width: 0; height: 0; opacity: 0.5; }
        to { width: 500px; height: 500px; opacity: 0; }
    }

    .card-display.pulse { transform: scale(1.05); }
    .card-display.success-pop { animation: successPop 0.4s ease; }

    @keyframes successPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); filter: brightness(1.5); }
        100% { transform: scale(1); }
    }

    .message-container { height: 2rem; overflow: hidden; }
    .message {
      font-size: 1.5rem;
      color: #38bdf8;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.4s;
    }
    .message.show { opacity: 1; transform: translateY(0); }

    .glitch-effect {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
      background: #450a0a !important;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-2px, 0, 0); }
      20%, 80% { transform: translate3d(4px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
      40%, 60% { transform: translate3d(6px, 0, 0); }
    }

    .reward-overlay {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 50;
        animation: fadeIn 0.5s ease;
    }

    .reward-flash { font-size: 2.5rem; color: #fbbf24; margin-bottom: 1rem; }
    .reward-detail { font-size: 1.25rem; color: #94a3b8; }

    .victory-state {
        background: linear-gradient(to bottom, #1e293b, #0f172a, #312e81) !important;
    }
  `]
})
export class GreatMindsBoardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() gameState: any;
  justPlayed: boolean = false;
  isError: boolean = false;
  isSuccess: boolean = false;
  isVictory: boolean = false;
  showReward: boolean = false;
  message: string = '';

  private gameEventsSubscription: Subscription | null = null;

  constructor(private readonly signalR: SignalRService) { }

  ngOnInit() {
    this.gameEventsSubscription = this.signalR.gameEvents$.subscribe(event => {
      if (!event) return;

      switch (event.type) {
        case 'CARD_PLAYED':
          this.triggerPlayAnim();
          break;
        case 'ERROR_PLAY':
          this.triggerErrorAnim();
          break;
        case 'REWARD_GRANTED':
          this.triggerRewardAnim();
          break;
        case 'VICTORY':
          this.isVictory = true;
          this.message = "TRANSCENDENCE ACHIEVED";
          break;
        case 'SYNC_EXECUTED':
          this.message = "MINDS REALIGNED";
          setTimeout(() => this.message = '', 3000);
          break;
      }
    });
  }

  ngOnDestroy() {
    if (this.gameEventsSubscription) this.gameEventsSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && !changes['gameState'].firstChange) {
      const prev = changes['gameState'].previousValue;
      const curr = changes['gameState'].currentValue;

      if (!prev || !curr) return;

      // Handle level up message
      if (curr.currentLevel > prev.currentLevel) {
        this.message = `LEVEL ${curr.currentLevel}`;
        setTimeout(() => this.message = '', 4000);
      }
    }
  }

  triggerPlayAnim() {
    this.isSuccess = true;
    this.justPlayed = true;
    setTimeout(() => {
      this.isSuccess = false;
      this.justPlayed = false;
    }, 600);
  }

  triggerErrorAnim() {
    this.isError = true;
    this.message = "CONNECTION BROKEN";
    setTimeout(() => {
      this.isError = false;
      this.message = '';
    }, 1500);
  }

  triggerRewardAnim() {
    this.showReward = true;
    setTimeout(() => this.showReward = false, 3000);
  }

  getGradient(num: number): string {
    if (num === 0) return 'rgba(255,255,255,0.05)';
    const hue = 200 + (num * 1.3);
    return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 40}, 80%, 40%))`;
  }
}

