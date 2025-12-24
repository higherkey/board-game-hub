import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';

@Component({
  selector: 'app-great-minds-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="player-container">
      <!-- MAIN ACTION -->
      <div class="main-action">
        <button class="play-btn" 
                (click)="playCard()" 
                [disabled]="!canPlay || cooldown"
                [style.background]="lowestCard ? getGradient(lowestCard) : '#333'">
          <span class="btn-text" *ngIf="lowestCard">{{ lowestCard }}</span>
          <span class="btn-sub" *ngIf="lowestCard">TAP TO PLAY</span>
          <span class="btn-text" *ngIf="!lowestCard">WAITING</span>
        </button>
      </div>

      <!-- QUEUE -->
      <div class="queue" *ngIf="myQueue.length > 0">
        <span class="queue-label">UP NEXT</span>
        <div class="queue-list">
          <div class="mini-card" *ngFor="let c of myQueue">
            {{ c }}
          </div>
        </div>
      </div>

      <!-- SYNC BTN -->
      <div class="footer-actions">
        <button class="sync-btn" (click)="useSync()" [disabled]="!canSync">
          ✨ SYNC ({{ gameState?.syncTokens || 0 }})
        </button>
      </div>
    </div>
  `,
  styles: [`
    .player-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 20px;
      justify-content: space-between;
      color: white;
    }

    .main-action {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .play-btn {
      width: 280px;
      height: 280px;
      border-radius: 50%;
      border: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s, filter 0.2s;
      position: relative;
      animation: pulse 2s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
      50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(255, 255, 255, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }

    .play-btn:active:not(:disabled) {
      transform: scale(0.95);
    }

    .play-btn:disabled {
      filter: grayscale(100%);
      opacity: 0.5;
    }

    .btn-text {
      font-size: 6rem;
      font-weight: 900;
      line-height: 1;
    }
    .btn-sub {
      font-size: 1rem;
      opacity: 0.8;
      letter-spacing: 2px;
      margin-top: 10px;
    }

    .queue {
      margin-bottom: 20px;
      text-align: center;
    }
    
    .queue-label {
      font-size: 0.8rem;
      letter-spacing: 2px;
      opacity: 0.6;
      display: block;
      margin-bottom: 10px;
    }

    .queue-list {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .mini-card {
      background: rgba(255,255,255,0.1);
      padding: 5px 10px;
      border-radius: 5px;
      font-weight: bold;
    }

    .sync-btn {
      width: 100%;
      padding: 15px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      border-radius: 10px;
      font-weight: bold;
      letter-spacing: 1px;
    }
  `]
})
export class GreatMindsPlayerComponent implements OnChanges {
  @Input() gameState: any;
  @Input() myConnectionId: string = '';

  lowestCard: number | null = null;
  myQueue: number[] = [];
  cooldown: boolean = false;

  constructor(private readonly signalR: SignalRService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.gameState?.myHand) {
      const hand = this.gameState.myHand as number[];
      if (hand.length > 0) {
        // Assume sorted
        this.lowestCard = hand[0];
        this.myQueue = hand.slice(1);
      } else {
        this.lowestCard = null;
        this.myQueue = [];
      }
    }
  }

  get canPlay(): boolean {
    return this.lowestCard !== null;
  }

  get canSync(): boolean {
    return (this.gameState?.syncTokens || 0) > 0;
  }

  playCard() {
    if (!this.lowestCard) return;

    // Optimistic Cooldown
    this.cooldown = true;
    setTimeout(() => this.cooldown = false, 1000); // Prevent accidental plays for 1s

    this.signalR.submitGreatMindsCard(this.lowestCard);
  }

  useSync() {
    if (confirm("Use a Sync Token? This discards everyone's lowest card.")) {
      this.signalR.submitGreatMindsSync();
    }
  }

  getGradient(num: number): string {
    const hue = 200 + (num * 1.3);
    return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 40}, 80%, 40%))`;
  }
}
