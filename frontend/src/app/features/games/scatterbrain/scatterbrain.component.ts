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
    <div class="container-fluid h-100 d-flex flex-column">
      <!-- HOST VIEW -->
      <div *ngIf="isHost" class="host-view h-100 d-flex flex-column">
        
        <!-- Header / Controls -->
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-surface-3 border-0 d-flex justify-content-between align-items-center py-3">
                <h3 class="m-0 fw-bold text-primary"><i class="bi bi-lightbulb-fill me-2"></i>Scatterbrain</h3>
                <div class="d-flex gap-2">
                     <button class="btn btn-light shadow-sm" *ngIf="!(room.isPaused)" (click)="pauseGame()">
                        <i class="bi bi-pause-fill"></i> Pause
                    </button>
                    <button class="btn btn-warning shadow-sm" *ngIf="room.isPaused" (click)="resumeGame()">
                        <i class="bi bi-play-fill"></i> Resume
                    </button>
                    <button class="btn btn-danger shadow-sm" (click)="endRound()">
                        <i class="bi bi-stop-fill"></i> End Round
                    </button>
                </div>
            </div>
        </div>

        <!-- Board Area -->
        <div class="flex-grow-1 d-flex flex-column align-items-center justify-content-center position-relative">
            <!-- Paused Overlay -->
             <div *ngIf="room.isPaused" class="position-absolute top-0 start-0 w-100 h-100 bg-surface bg-opacity-90 d-flex flex-column justify-content-center align-items-center z-index-10">
                <h1 class="display-1 fw-bold text-warning mb-3">PAUSED</h1>
                <p class="text-secondary fs-4">Game is currently paused by host</p>
            </div>

            <div class="row w-100 justify-content-center g-4">
                <!-- Letter Box -->
                <div class="col-md-5 col-xl-4 text-center">
                    <div class="card bg-dark text-white shadow-lg border-0 h-100 justify-content-center py-5">
                         <div class="card-body">
                            <h6 class="text-uppercase text-white-50 letter-spacing-2 mb-3">Current Letter</h6>
                            <h1 class="display-1 fw-black letter-huge">{{ room.gameState?.currentLetter || '?' }}</h1>
                         </div>
                    </div>
                </div>

                <!-- Timer & Info -->
                <div class="col-md-5 col-xl-4">
                     <div class="card border-0 shadow-sm h-100 mb-3">
                        <div class="card-body text-center d-flex flex-column justify-content-center">
                            <h6 class="text-uppercase text-secondary letter-spacing-2">Time Remaining</h6>
                            <div class="display-2 fw-bold my-2" [class.text-danger]="(timeLeft$ | async)! < 10">
                                {{ timeLeft$ | async }}
                            </div>
                            <div class="progress h-2 mt-3 bg-surface-2">
                                <div class="progress-bar" [class.bg-danger]="(timeLeft$ | async)! < 10" [class.bg-success]="(timeLeft$ | async)! >= 10" role="progressbar" [style.width.%]="((timeLeft$ | async)! / 60) * 100"></div>
                            </div>
                        </div>
                     </div>
                     
                     <div class="card border-0 shadow-sm bg-primary text-white">
                        <div class="card-body text-center">
                             <h6 class="text-white-50 text-uppercase letter-spacing-2 mb-1">Round</h6>
                             <h2 class="fw-bold m-0">{{ room.roundNumber || 1 }}</h2>
                        </div>
                     </div>
                </div>
            </div>

            <!-- Categories List -->
            <div class="row w-100 justify-content-center mt-4">
                <div class="col-lg-10 col-xl-8">
                    <div class="card border-0 shadow-lg">
                        <div class="card-header bg-white border-bottom-0 pt-4 pb-2">
                             <h5 class="fw-bold text-center text-uppercase text-primary letter-spacing-1">Running List</h5>
                        </div>
                        <div class="card-body pt-0">
                            <div class="row g-0">
                                <div class="col-md-6" *ngFor="let cat of room.gameState?.categories; let i = index">
                                    <div class="p-3 border-bottom d-flex align-items-center">
                                         <span class="badge rounded-pill bg-surface-2 text-dark me-3" style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center;">{{ i + 1 }}</span>
                                         <span class="fs-5">{{ cat }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- PLAYER VIEW -->
      <div *ngIf="!isHost" class="player-view h-100 overflow-auto p-3">
         <!-- Sticky Status Bar -->
         <div class="sticky-top bg-surface shadow-sm rounded-3 p-3 mb-4 d-flex justify-content-between align-items-center border border-primary-subtle z-index-5">
             <div class="d-flex align-items-center gap-3">
                 <div class="bg-dark text-white rounded p-2 text-center" style="min-width: 50px;">
                     <h3 class="m-0 fw-bold lh-1">{{ room.gameState?.currentLetter || '?' }}</h3>
                 </div>
                 <div class="d-flex flex-column">
                     <small class="text-uppercase text-secondary fw-bold" style="font-size: 0.7rem;">Letter</small>
                     <span class="fw-bold text-primary">Scatterbrain</span>
                 </div>
             </div>
             <div class="text-end">
                  <div class="display-6 fw-bold lh-1" [class.text-danger]="(timeLeft$ | async)! < 10">{{ timeLeft$ | async }}</div>
                  <small class="text-secondary">seconds</small>
             </div>
         </div>

         <!-- Input Form -->
         <div class="container px-0" style="max-width: 600px;">
             <div class="card border-0 shadow-sm mb-5">
                 <div class="card-body p-4">
                    <h5 class="card-title fw-bold mb-4 text-center">Fill in your answers!</h5>
                    
                    <div class="mb-4" *ngFor="let cat of room.gameState?.categories; let i = index">
                        <label [for]="'cat-'+i" class="form-label fw-bold text-surface-inverse mb-1">
                            <span class="text-primary me-1">{{i + 1}}.</span> {{ cat }}
                        </label>
                        <input type="text" [id]="'cat-'+i" 
                            class="form-control form-control-lg bg-surface-2 border-0" 
                            [(ngModel)]="answers[i]" 
                            (blur)="autoSave()"
                            [placeholder]="'Starts with ' + (room.gameState?.currentLetter || '...')" 
                            autocomplete="off">
                    </div>

                    <div class="d-grid mt-5">
                        <button class="btn btn-success btn-lg py-3 fw-bold shadow-sm" (click)="submitAnswers()" [disabled]="isSubmitting">
                            <span *ngIf="!isSubmitting">SUBMIT ANSWERS <i class="bi bi-send-fill ms-2"></i></span>
                            <span *ngIf="isSubmitting"><span class="spinner-border spinner-border-sm me-2"></span> Sending...</span>
                        </button>
                    </div>
                 </div>
             </div>
         </div>
      </div>
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
        // Initialize answers array if needed
        if (this.room?.gameState?.categories) {
            this.answers = new Array(this.room.gameState.categories.length).fill('');
        }

        // If we already have answers (re-joining etc), load them
        // Note: Room object might not contain 'my' answers directly in a convenient way depending on backend model 
        // but commonly we might want to preserve local state or check PlayerAnswers if exposed.
        // For now, simple init.
    }

    autoSave() {
        // Optional: Debounced local save or silent submit? 
        // For Scatterbrain, usually manual submit is fine, but we could do silent sync.
    }

    submitAnswers() {
        this.isSubmitting = true;
        try {
            // Filter or process answers if needed? No, send all indices to match categories.
            // Replace empty with empty string just in case.
            const cleanAnswers = this.answers.map(a => a ? a.trim() : '');
            this.signalRService.submitAnswers(cleanAnswers);
        } catch (err) {
            console.error('Error submitting answers', err);
        } finally {
            this.isSubmitting = false;
        }
    }

    pauseGame() { this.signalRService.pauseGame(); }
    resumeGame() { this.signalRService.resumeGame(); }
    endRound() { this.signalRService.endRound(); }
}
