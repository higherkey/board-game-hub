import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../services/signalr.service';
import { GreatMindsBoardComponent } from './great-minds-board/great-minds-board.component';
import { GreatMindsPlayerComponent } from './great-minds-player/great-minds-player.component';
import { GreatMindsRulesComponent } from './great-minds-rules/great-minds-rules.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-great-minds',
  standalone: true,
  imports: [CommonModule, GreatMindsBoardComponent, GreatMindsPlayerComponent, GreatMindsRulesComponent],
  template: `
    <div class="great-minds-container">
      <div class="top-nav" *ngIf="!isHost">
        <button class="info-btn" (click)="showRules = true" title="How to Play">
          <span>?</span>
        </button>
      </div>

      <app-great-minds-rules 
        *ngIf="showRules" 
        (closeRules)="showRules = false">
      </app-great-minds-rules>

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
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
      color: white;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .top-nav {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 50;
    }

    .info-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(5px);
      transition: all 0.2s;
    }

    .info-btn:hover {
      background: rgba(255,255,255,0.2);
    }
  `]
})
export class GreatMindsGameComponent implements OnInit, OnDestroy {
  @Input() isHost: boolean = false;
  gameState: any = null;
  myConnectionId: string = '';
  showRules: boolean = false;

  private subscription: Subscription | null = null;

  constructor(
    private readonly signalR: SignalRService
  ) { }

  ngOnInit() {
    this.myConnectionId = this.signalR.getConnectionId() || '';

    this.subscription = this.signalR.gameState$.subscribe((state: any) => {
      if (state) {
        this.gameState = state;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
