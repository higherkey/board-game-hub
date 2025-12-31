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
