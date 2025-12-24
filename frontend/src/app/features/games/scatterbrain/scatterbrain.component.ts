import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, Room } from '../../../services/signalr.service';
import { Observable, map, timer } from 'rxjs';

@Component({
    selector: 'app-scatterbrain',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="container-fluid h-100 d-flex flex-column py-3 overflow-auto">
      
      <!-- 1. WRITING PHASE (Current View Refactored) -->
      <ng-container *ngIf="phase === 'Writing'">
          <!-- HOST VIEW: Progress Summary -->
          <div *ngIf="isHost" class="host-view h-100 d-flex flex-column">
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-surface-3 border-0 d-flex justify-content-between align-items-center py-3">
                    <h3 class="m-0 fw-bold text-primary"><i class="bi bi-pencil-fill me-2"></i>Writing Phase</h3>
                    <div class="d-flex gap-2">
                        <button class="btn btn-warning shadow-sm" *ngIf="!room.isPaused" (click)="pauseGame()"><i class="bi bi-pause-fill"></i></button>
                        <button class="btn btn-success shadow-sm" *ngIf="room.isPaused" (click)="resumeGame()"><i class="bi bi-play-fill"></i></button>
                        <button class="btn btn-danger shadow-sm" (click)="nextPhase()">End Early <i class="bi bi-skip-end-fill"></i></button>
                    </div>
                </div>
            </div>

            <div class="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4">
                <div class="row w-100 justify-content-center g-4 mb-4">
                    <div class="col-md-4 text-center">
                        <div class="card bg-dark text-white shadow-lg border-0 py-4">
                            <h6 class="text-white-50 text-uppercase small mb-2">Letter</h6>
                            <h1 class="display-2 fw-black m-0">{{ room.gameState?.currentLetter || '?' }}</h1>
                        </div>
                    </div>
                    <div class="col-md-4 text-center">
                        <div class="card border-0 shadow-sm py-4">
                            <h6 class="text-secondary text-uppercase small mb-2">Time Remaining</h6>
                            <h1 class="display-2 fw-bold m-0" [class.text-danger]="(timeLeft$ | async)! < 10">{{ timeLeft$ | async }}</h1>
                        </div>
                    </div>
                </div>

                <div class="submission-grid w-100" style="max-width: 800px;">
                    <h5 class="text-center text-uppercase text-secondary mb-3">Player Progress</h5>
                    <div class="d-flex flex-wrap justify-content-center gap-3">
                          <div *ngFor="let p of room.players" class="badge rounded-pill p-3 border shadow-sm d-flex align-items-center gap-2"
                               [class.bg-success]="room.gameState?.playerAnswers?.[p.connectionId]"
                               [class.bg-surface-2]="!room.gameState?.playerAnswers?.[p.connectionId]"
                               [class.text-white]="room.gameState?.playerAnswers?.[p.connectionId]"
                               [class.text-dark]="!room.gameState?.playerAnswers?.[p.connectionId]">
                               <i class="bi" [class.bi-check-circle-fill]="room.gameState?.playerAnswers?.[p.connectionId]" [class.bi-clock]="!room.gameState?.playerAnswers?.[p.connectionId]"></i>
                               {{ p.name }}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- PLAYER VIEW: Input Form -->
          <div *ngIf="!isHost" class="player-view container" style="max-width: 600px;">
              <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
                  <div class="card-header bg-primary text-white p-4 d-flex justify-content-between align-items-center">
                      <div>
                          <h6 class="text-white-50 text-uppercase small mb-0">Letter</h6>
                          <h2 class="m-0 fw-black">{{ room.gameState?.currentLetter || '?' }}</h2>
                      </div>
                      <div class="text-end">
                          <h6 class="text-white-50 text-uppercase small mb-0">Timer</h6>
                          <h2 class="m-0 fw-bold">{{ timeLeft$ | async }}s</h2>
                      </div>
                  </div>
                  <div class="card-body p-4 bg-surface-2">
                      <div class="mb-4" *ngFor="let cat of room.gameState?.categories; let i = index">
                          <label class="form-label fw-bold small text-secondary mb-1">{{ i + 1 }}. {{ cat }}</label>
                          <input type="text" class="form-control form-control-lg border-0 shadow-sm"
                                 [(ngModel)]="answers[i]" (blur)="submitAnswers()"
                                 [placeholder]="'Starts with ' + room.gameState.currentLetter"
                                 autocomplete="off">
                      </div>
                      <div class="d-grid mt-4">
                         <button class="btn btn-success btn-lg fw-bold shadow-sm" (click)="submitAnswers()" [disabled]="isSubmitting">
                             <i class="bi bi-check2-all me-2"></i> SUBMIT FINAL ANSWERS
                         </button>
                      </div>
                  </div>
              </div>
          </div>
      </ng-container>

      <!-- 2. VALIDATION PHASE -->
      <ng-container *ngIf="phase === 'Validation'">
          <div class="card shadow-lg border-primary-subtle rounded-4 h-100 d-flex flex-column">
              <div class="card-header bg-white border-bottom-0 p-4 d-flex justify-content-between align-items-center">
                  <div>
                      <h4 class="m-0 fw-bold text-primary">Validation Phase</h4>
                      <p class="text-secondary small m-0">Click any answer to Veto it if it doesn't fit or follow the rules.</p>
                  </div>
                  <button *ngIf="isHost" class="btn btn-primary px-4 fw-bold" (click)="nextPhase()">
                      Finalize Scores <i class="bi bi-calculator ms-2"></i>
                  </button>
              </div>
              <div class="card-body p-0 overflow-auto">
                  <table class="table table-hover align-middle m-0">
                      <thead class="bg-surface-3 sticky-top">
                          <tr>
                              <th style="width: 250px;">Category</th>
                              <th *ngFor="let p of room.players" class="text-center">{{ p.name }}</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr *ngFor="let cat of room.gameState?.categories; let i = index">
                              <td class="fw-bold text-secondary bg-surface-2"><span class="text-primary me-2">{{ i+1 }}.</span> {{ cat }}</td>
                              <td *ngFor="let p of room.players" class="text-center p-1">
                                  <div class="answer-box p-2 rounded cursor-pointer transition-all border"
                                       (click)="isHost && toggleVeto(p.connectionId, i)"
                                       [class.bg-danger-subtle]="isVetoed(p.connectionId, i)"
                                       [class.border-danger]="isVetoed(p.connectionId, i)"
                                       [class.bg-light]="!isVetoed(p.connectionId, i)"
                                       [class.border-transparent]="!isVetoed(p.connectionId, i)"
                                       [class.text-decoration-line-through]="isVetoed(p.connectionId, i)"
                                       [class.opacity-50]="isVetoed(p.connectionId, i)"
                                       [title]="isHost ? 'Click to toggle veto' : ''">
                                       <span *ngIf="room.gameState?.playerAnswers?.[p.connectionId]?.[i]; else emptyAns">
                                           {{ room.gameState?.playerAnswers?.[p.connectionId][i] }}
                                       </span>
                                       <ng-template #emptyAns><span class="text-muted italic small">No answer</span></ng-template>
                                       <i *ngIf="isVetoed(p.connectionId, i)" class="bi bi-x-circle-fill text-danger ms-2"></i>
                                  </div>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </ng-container>

      <!-- 3. RESULT PHASE -->
      <ng-container *ngIf="phase === 'Result'">
          <div class="container h-100 d-flex flex-column align-items-center justify-content-center">
              <div class="card shadow-lg border-0 rounded-4 overflow-hidden" style="width: 100%; max-width: 600px;">
                  <div class="card-header bg-gradient-brand text-white text-center py-4">
                      <h2 class="fw-black m-0">ROUND RESULTS</h2>
                      <p class="m-0 text-white-50">Points earned this round</p>
                  </div>
                  <div class="card-body p-5">
                      <div class="leaderboard-list">
                          <div *ngFor="let p of room.players | slice : 0 : 10; let idx = index" 
                               class="d-flex align-items-center justify-content-between p-3 mb-3 rounded-4 shadow-sm border"
                               [class.bg-primary-subtle]="p.connectionId === myConnectionId"
                               [class.border-primary]="p.connectionId === myConnectionId">
                              <div class="d-flex align-items-center gap-3">
                                  <span class="fs-4 fw-black text-secondary">{{ idx + 1 }}</span>
                                  <span class="fs-5 fw-bold">{{ p.name }}</span>
                              </div>
                              <div class="text-end">
                                  <span class="display-6 fw-black text-primary">+{{ room.roundScores[p.connectionId] || 0 }}</span>
                                  <div class="small text-secondary fw-bold">TOTAL: {{ p.score || 0 }}</div>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div class="card-footer bg-white border-0 text-center pb-4">
                      <button *ngIf="isHost" class="btn btn-primary btn-lg px-5 fw-bold shadow-sm" (click)="nextPhase()">
                          Next Round <i class="bi bi-arrow-right-circle ms-2"></i>
                      </button>
                      <p *ngIf="!isHost" class="text-secondary italic">Waiting for host to start next round...</p>
                  </div>
              </div>
          </div>
      </ng-container>

    </div>
  `,
    styles: [`
    .letter-huge { font-size: 6rem; }
    .letter-spacing-1 { letter-spacing: 1px; }
    .letter-spacing-2 { letter-spacing: 2px; }
    .z-index-10 { z-index: 10; }
    .z-index-5 { z-index: 5; }
    .bg-surface-3 { background-color: var(--surface-3, #f8f9fa); }
    .fw-black { font-weight: 900; }
    .cursor-pointer { cursor: pointer; }
    .bg-gradient-brand { background: linear-gradient(135deg, var(--primary), var(--accent)); }
    .transition-all { transition: all 0.2s ease; }
    .answer-box:hover { transform: scale(1.02); }
  `]
})
export class ScatterbrainComponent implements OnInit {
    @Input() room!: Room;
    @Input() myConnectionId!: string;
    @Input() isHost: boolean = false;

    timeLeft$: Observable<number>;
    answers: string[] = [];
    isSubmitting = false;

    constructor(private readonly signalRService: SignalRService) {
        this.timeLeft$ = timer(0, 1000).pipe(
            map(() => {
                if (!this.room?.roundEndTime || this.room.isPaused) return 0;
                const end = new Date(this.room.roundEndTime).getTime();
                const now = Date.now();
                return Math.max(0, Math.ceil((end - now) / 1000));
            })
        );
    }

    ngOnInit() {
        this.initAnswers();
    }

    private initAnswers() {
        if (this.room?.gameState?.categories) {
            const count = this.room.gameState.categories.length;
            if (this.answers.length !== count) {
                this.answers = new Array(count).fill('');
            }
        }
    }

    get phase(): 'Writing' | 'Validation' | 'Result' {
        const val = this.room?.gameState?.phase;
        if (val === 0) return 'Writing';
        if (val === 1) return 'Validation';
        if (val === 2) return 'Result';
        return 'Writing';
    }

    autoSave() {
        // Optional: Debounced local save or silent submit? 
        // For Scatterbrain, usually manual submit is fine, but we could do silent sync.
    }

    submitAnswers() {
        // Only allow submitting in Writing phase
        if (this.phase !== 'Writing') return;

        this.isSubmitting = true;
        try {
            const cleanAnswers = this.answers.map(a => a ? a.trim() : '');
            this.signalRService.submitAnswers(cleanAnswers);
        } catch (err) {
            console.error('Error submitting answers', err);
        } finally {
            this.isSubmitting = false;
        }
    }

    toggleVeto(targetPlayerId: string, categoryIndex: number) {
        if (!this.isHost || this.phase !== 'Validation') return;
        this.signalRService.sendGameAction('TOGGLE_VETO', { targetPlayerId, categoryIndex });
    }

    isVetoed(playerId: string, categoryIndex: number): boolean {
        const vetoes = this.room?.gameState?.vetoes?.[playerId];
        return vetoes ? vetoes.includes(categoryIndex) : false;
    }

    nextPhase() {
        if (!this.isHost) return;
        if (this.phase === 'Result') {
            // Start next round
            this.signalRService.startGame();
        } else {
            this.signalRService.sendGameAction('NEXT_PHASE', {});
        }
    }

    pauseGame() { this.signalRService.pauseGame(); }
    resumeGame() { this.signalRService.resumeGame(); }
    endRound() { this.nextPhase(); }
}
