import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../services/signalr.service';
import { Observable, map, timer } from 'rxjs';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card shadow-lg">
      <div class="card-header bg-primary text-white text-center d-flex justify-content-between align-items-center">
        <h2 class="m-0">Scatterbrain</h2>
        <div *ngIf="isHost">
            <button class="btn btn-sm btn-light me-2" *ngIf="!(room$ | async)?.isPaused" (click)="pauseGame()">
                <i class="bi bi-pause-fill"></i> Pause
            </button>
            <button class="btn btn-sm btn-warning me-2" *ngIf="(room$ | async)?.isPaused" (click)="resumeGame()">
                <i class="bi bi-play-fill"></i> Resume
            </button>
            <button class="btn btn-sm btn-danger" (click)="endRound()">
                <i class="bi bi-stop-fill"></i> End Round
            </button>
        </div>
      </div>
      <div class="card-body text-center position-relative">
        
        <!-- Paused Overlay -->
        <div *ngIf="(room$ | async)?.isPaused" class="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center" style="z-index: 10;">
            <h1 class="display-1 text-danger fw-bold">PAUSED</h1>
        </div>

        <div class="row align-items-center mb-4">
          <div class="col-md-4">
             <div class="letter-box bg-dark text-white p-4 rounded d-inline-block">
                <span class="display-1 fw-bold">{{ (room$ | async)?.gameState?.currentLetter || '?' }}</span>
                <div class="text-uppercase small mt-2">Letter</div>
             </div>
          </div>
          <div class="col-md-4">
             <div class="timer-display shadow-sm p-3 rounded" [class.bg-danger]="(timeLeft$ | async)! < 10" [class.text-white]="(timeLeft$ | async)! < 10">
                <span class="display-3 fw-bold">{{ timeLeft$ | async }}</span>
                <div>seconds</div>
             </div>
          </div>
          <div class="col-md-4">
              <div class="card bg-light">
                  <div class="card-body">
                      <h6>Round</h6>
                      <h3 class="fw-bold">{{ (room$ | async)?.roundNumber || 1 }}</h3>
                  </div>
              </div>
          </div>
        </div>

        <div class="categories-grid mt-4">
            <div class="row">
                <div class="col-md-6 text-start" *ngFor="let cat of (room$ | async)?.gameState?.categories; let i = index">
                    <div class="p-2 border-bottom">
                       <span class="badge bg-secondary me-2">{{i + 1}}</span> {{ cat }}
                    </div>
                </div>
            </div>
        </div>
      </div>
      <div class="card-footer text-muted" *ngIf="isHost">
        <small>You are the Host. Use controls above to manage the game.</small>
      </div>
    </div>
  `,
  styles: [`
    .letter-box { min-width: 150px; }
  `]
})
export class GameBoardComponent {
  @Input() roomCode = '';
  @Input() isHost = false;
  room$: Observable<any>;
  timeLeft$: Observable<number>;

  constructor(private readonly signalRService: SignalRService) {
    this.room$ = this.signalRService.currentRoom$;
    this.timeLeft$ = timer(0, 1000).pipe(
      map(x => {
        const room = this.signalRService.currentRoomSubject.value;
        if (!room?.roundEndTime || room.isPaused) return 0; // Don't tick if paused (handled by backend mostly but visual fix)
        // Actually if paused, backend sets TimeRemainingWhenPaused.

        let end = new Date(room.roundEndTime).getTime();

        // Visual adjustment for pause? 
        // If paused, we show room.TimeRemaining?
        // Let's stick to simple calc:
        if (room.isPaused) return 0; // or last known? 

        const now = Date.now();
        return Math.max(0, Math.ceil((end - now) / 1000));
      })
    );
  }


  pauseGame() { this.signalRService.pauseGame(); }
  resumeGame() { this.signalRService.resumeGame(); }
  endRound() { this.signalRService.endRound(); }
}
