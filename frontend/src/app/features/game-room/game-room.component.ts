import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalRService, GameSettings } from '../../services/signalr.service';
import { GameBoardComponent } from '../game-board/game-board.component';
import { MobileControllerComponent } from '../mobile-controller/mobile-controller.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { BoggleComponent } from '../games/boggle.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule, GameBoardComponent, MobileControllerComponent, HostSettingsComponent, VideoChatComponent, BoggleComponent, GameReviewComponent, SocialPanelComponent],
  template: `
    <div class="container-fluid mt-3">
      <!-- Header / Status Bar -->
       <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-3">
             <button class="btn btn-outline-danger btn-sm" (click)="leaveRoom()">
                <i class="bi bi-box-arrow-left"></i> Leave
             </button>
             <span class="badge bg-dark">Room: {{ roomCode }}</span>
          </div>
          <span class="badge" [class.bg-success]="(connectionStatus$ | async) === 'Connected'" [class.bg-danger]="(connectionStatus$ | async) === 'Disconnected'">
             {{ connectionStatus$ | async }}
          </span>
       </div>

      <!-- WAITING ROOM (LOBBY) -->
      <div *ngIf="!(gameStarted$ | async); else activeGame">
          <div class="text-center mt-4">
            <h1 class="display-5 mb-4">Lobby</h1>
            
            <div class="row justify-content-center">
                <!-- Players List -->
                <div class="col-md-4 mb-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-header bg-primary text-white">
                            <h5 class="m-0">Players Joined</h5>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let player of players$ | async">
                                {{ player.name }}
                                <span *ngIf="player.isHost" class="badge bg-primary">HOST</span>
                            </li>
                            <li *ngIf="(players$ | async)?.length === 0" class="list-group-item text-muted">Waiting for players...</li>
                        </ul>
                    </div>
                </div>

                <!-- Host Settings (Only for Host) -->
                <div class="col-md-5 mb-4" *ngIf="isHost$ | async">
                    <app-host-settings 
                        [roomCode]="roomCode"
                        [currentGameType]="(currentRoom$ | async)?.gameType"
                        (onStart)="startGame($event)">
                    </app-host-settings>
                </div>

                <!-- Waiting Message (For Non-Host) -->
                <div class="col-md-5 mb-4" *ngIf="!(isHost$ | async)">
                    <div class="alert alert-info text-center h-100 d-flex flex-column justify-content-center" role="status">
                        <h4>Waiting for Host to start...</h4>
                        <div class="spinner-border text-info mt-3 mx-auto" aria-hidden="true"></div>
                    </div>
                </div>
            </div>

            <!-- Video Chat in Lobby -->
            <div class="row justify-content-center mt-4">
               <div class="col-12">
                   <app-video-chat></app-video-chat>
               </div>
            </div>
          </div>
      </div>

      <!-- ACTIVE GAME -->
      <ng-template #activeGame>
         <div class="row">
             <!-- HOST VIEW (Left) -->
             <div class="col-md-8 mb-4">
                <h4 class="text-secondary mb-3">Host View (TV)</h4>
                
                <div [ngSwitch]="(currentRoom$ | async)?.gameType">
                    <!-- BOGGLE GAME -->
                    <app-boggle *ngSwitchCase="'Boggle'" 
                        [grid]="(currentRoom$ | async)?.gameState?.grid"
                        [isPlaying]="(currentRoom$ | async)?.state === 'Playing'"
                        (wordsUpdated)="onBoggleWordsUpdated($event)">
                    </app-boggle>
                    
                    <!-- SCATTERBRAIN GAME (Default) -->
                    <div *ngSwitchDefault>
                        <div [ngSwitch]="(currentRoom$ | async)?.state">
                             <app-game-review *ngSwitchCase="'Finished'" 
                                [room]="(currentRoom$ | async)!" 
                                [isHost]="(isHost$ | async)!">
                             </app-game-review>
                             
                             <app-game-board *ngSwitchDefault 
                                [roomCode]="roomCode" 
                                [isHost]="(isHost$ | async)!">
                             </app-game-board>
                        </div>
                    </div>
                </div>
             </div>
             
             <!-- PLAYER VIEW (Right - For Testing) -->
             <div class="col-md-4">
                <h4 class="text-secondary mb-3">Player View (Mobile)</h4>
                <div class="device-frame border rounded p-2" style="max-width: 400px; margin: 0 auto; background: #000;">
                    <app-video-chat></app-video-chat>
                    <app-mobile-controller [roomCode]="roomCode"></app-mobile-controller>
                </div>
                <div class="alert alert-warning mt-3 small">
                    <i class="bi bi-info-circle" aria-hidden="true"></i> Debug Mode: Showing both views for testing.
                </div>
             </div>
         </div>
      </ng-template>
    </div>
  `
})
export class GameRoomComponent implements OnInit {
  roomCode = '';
  players$: Observable<any[]>;
  connectionStatus$: Observable<string>;
  gameStarted$: Observable<boolean>;
  isHost$: Observable<boolean>;
  currentRoom$: Observable<any>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly signalRService: SignalRService,
    private readonly router: Router
  ) {
    this.players$ = this.signalRService.players$;
    this.connectionStatus$ = this.signalRService.connectionStatus$;
    this.currentRoom$ = this.signalRService.currentRoom$;

    // Game started if state is Playing or Finished
    this.gameStarted$ = this.signalRService.currentRoom$.pipe(map(r => r?.state === 'Playing' || r?.state === 'Finished'));

    this.isHost$ = this.players$.pipe(map((all: any[]) => {
      const myName = this.route.snapshot.queryParamMap.get('name');
      const me = all.find(p => p.name === myName);
      return me?.isHost || false;
    }));
  }

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';
    this.signalRService.startConnection();

    // Auto-join if name param exists (e.g. from redirect)
    const name = this.route.snapshot.queryParamMap.get('name');
    if (name) {
      this.signalRService.joinRoom(this.roomCode, name);
    }
  }

  startGame(settings: GameSettings) {
    this.signalRService.startGame(settings);
  }

  onBoggleWordsUpdated(words: string[]) {
    this.signalRService.submitAnswers(words);
  }

  async leaveRoom() {
    if (this.roomCode) {
      await this.signalRService.leaveRoom(this.roomCode);
    }
    this.router.navigate(['/games']);
  }
}
