import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';
import { GreatMindsBoardComponent } from '../great-minds-board/great-minds-board.component';
import { GreatMindsPlayerComponent } from '../great-minds-player/great-minds-player.component';
import { GreatMindsRulesComponent } from '../great-minds-rules/great-minds-rules.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-great-minds',
  standalone: true,
  imports: [CommonModule, GreatMindsBoardComponent, GreatMindsPlayerComponent, GreatMindsRulesComponent],
  templateUrl: './great-minds.component.html',
  styleUrls: ['./great-minds.component.scss']
})
export class GreatMindsGameComponent implements OnInit, OnDestroy {
  @Input() isHost: boolean = false;
  gameState: any = null;
  players: any[] = [];
  myConnectionId: string = '';
  showRules: boolean = false;
  private subscription: Subscription | null = null;
  private roomSubscription: Subscription | null = null;

  constructor(
    private readonly signalR: SignalRService
  ) { }

  ngOnInit() {
    this.myConnectionId = this.signalR.getConnectionId() || '';

    // Legacy: this.subscription = this.signalR.gameState$.subscribe... REMOVED

    this.roomSubscription = this.signalR.currentRoom$.subscribe(room => {
      if (room && room.gameData) {
        this.players = room.players;

        // Adapter Layer: Convert Server V2 State to Frontend V1 Expectation
        const rawState = room.gameData;
        const myHand = rawState.playerHands?.[this.myConnectionId] || [];

        const otherHandCounts: { [key: string]: number } = {};
        if (rawState.playerHands) {
          Object.keys(rawState.playerHands).forEach(key => {
            if (key !== this.myConnectionId) {
              otherHandCounts[key] = Array.isArray(rawState.playerHands[key]) ? rawState.playerHands[key].length : 0;
            }
          });
        }

        // Create a shallow copy enriched with derived data
        this.gameState = {
          ...rawState,
          myHand: myHand,
          otherHandCounts: otherHandCounts
        };
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.roomSubscription) this.roomSubscription.unsubscribe();
  }
}
