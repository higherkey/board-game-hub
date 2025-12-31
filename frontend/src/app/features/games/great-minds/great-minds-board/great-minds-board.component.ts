import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-great-minds-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './great-minds-board.component.html',
  styleUrls: ['./great-minds-board.component.scss']
})
export class GreatMindsBoardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() gameState: any;
  @Input() isHost: boolean = false;
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

  get isDefeat(): boolean {
    return this.gameState?.lives === 0;
  }

  restartGame() {
    this.signalR.startGame();
  }
}

