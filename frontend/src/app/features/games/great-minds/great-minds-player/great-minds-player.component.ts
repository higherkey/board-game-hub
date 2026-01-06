import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';

@Component({
  selector: 'app-great-minds-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './great-minds-player.component.html',
  styleUrls: ['./great-minds-player.component.scss']
})
export class GreatMindsPlayerComponent implements OnChanges {
  @Input() gameState: any;
  @Input() myConnectionId: string = '';

  myHand: number[] = [];
  lowestCard: number | null = null;
  cooldown: boolean = false;

  // Swipe State
  startY: number = 0;
  currentY: number = 0;
  isSwiping: boolean = false;
  presenceValue: number = 0;
  swipeThreshold: number = 200; // Pixels to trigger play

  constructor(private readonly signalR: SignalRService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.gameState?.myHand) {
      this.myHand = this.gameState.myHand as number[];
      this.lowestCard = this.myHand.length > 0 ? Math.min(...this.myHand) : null;
    }
  }

  get canSync(): boolean {
    return (this.gameState?.syncTokens || 0) > 0;
  }

  // --- TOUCH HANDLERS ---

  onTouchStart(event: TouchEvent, card: number) {
    if (card !== this.lowestCard || this.cooldown) return;

    this.startY = event.touches[0].clientY;
    this.isSwiping = true;
    this.updatePresence(0);
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isSwiping) return;

    this.currentY = event.touches[0].clientY;
    const dist = Math.max(0, this.startY - this.currentY);
    const progress = Math.min(1, dist / this.swipeThreshold);

    this.presenceValue = progress;
    this.updatePresence(progress);
  }

  onTouchEnd() {
    if (!this.isSwiping) return;

    if (this.presenceValue >= 0.95) {
      this.playCard();
    } else {
      // Reset
      this.updatePresence(0);
    }

    this.isSwiping = false;
    this.presenceValue = 0;
  }

  private lastPresenceSent: number = -1;
  private updatePresence(val: number) {
    // Throttle or only send significant changes
    if (Math.abs(val - this.lastPresenceSent) < .05 && val !== 0 && val !== 1) return;

    this.lastPresenceSent = val;
    this.signalR.sendGameAction('PRESENCE_UPDATE', { value: val });
  }

  playCard() {
    if (!this.lowestCard) return;

    this.cooldown = true;
    setTimeout(() => this.cooldown = false, 1000);

    this.signalR.submitGreatMindsCard(this.lowestCard);
    this.updatePresence(0); // Clear presence immediately after play
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

  getCardStyle(card: number) {
    if (card !== this.lowestCard) return {};

    const translateY = -this.presenceValue * 150; // Visual lift
    const scale = 1 + (this.presenceValue * 0.1);

    return {
      transform: `translateY(${translateY}px) scale(${scale})`,
      zIndex: 100,
      boxShadow: `0 ${10 + this.presenceValue * 40}px ${20 + this.presenceValue * 60}px rgba(0,0,0,0.5)`
    };
  }
}

