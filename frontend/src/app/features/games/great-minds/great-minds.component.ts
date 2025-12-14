import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../services/signalr.service';
import { GreatMindsBoardComponent } from './great-minds-board/great-minds-board.component';
import { GreatMindsPlayerComponent } from './great-minds-player/great-minds-player.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-great-minds',
  standalone: true,
  imports: [CommonModule, GreatMindsBoardComponent, GreatMindsPlayerComponent],
  template: `
    <div class="great-minds-container">
      <ng-container *ngIf="isHost; else playerView">
        <app-great-minds-board [gameState]="gameState"></app-great-minds-board>
      </ng-container>
      <ng-template #playerView>
        <app-great-minds-player 
            [gameState]="gameState" 
            [myConnectionId]="myConnectionId">
        </app-great-minds-player>
      </ng-template>
    </div>
  `,
  styles: [`
    .great-minds-container {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #1a2a6c, #b21f1f, #fdbb2d); /* Fallback / Placeholder */
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); /* Deep Zenith Theme */
      color: white;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class GreatMindsGameComponent implements OnInit, OnDestroy {
  @Input() isHost: boolean = false;
  gameState: any = null;
  myConnectionId: string = '';

  private subscription: Subscription | null = null;

  constructor(
    private readonly signalR: SignalRService
  ) { }

  ngOnInit() {
    this.myConnectionId = this.signalR.getConnectionId() || '';

    this.subscription = this.signalR.gameState$.subscribe((state: any) => {
      // Only update if it's relevant to us (could check gameType if available in state, or assume active room)
      if (state) {
        this.gameState = state;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
