import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-poppycock-player',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="h-100 d-flex flex-column text-center">
      
      <!-- Phase: Faking -->
      <div *ngIf="gameData?.phase === 0" class="flex-grow-1 d-flex flex-column justify-content-center">
        <h4 class="text-secondary text-uppercase mb-2">{{ gameData?.currentPrompt?.category }}</h4>
        <h2 class="display-3 fw-bold text-accent mb-4">{{ gameData?.currentPrompt?.word }}</h2>
        
        <div *ngIf="!hasSubmitted; else submittedState">
            <p class="lead mb-3">Write a fake definition that sounds real!</p>
            <div class="form-group mb-4">
                <textarea 
                    class="form-control form-control-lg bg-surface border-0 shadow-inner text-white" 
                    rows="4" 
                    [(ngModel)]="definition" 
                    placeholder="e.g. A type of small crustacean found in..."
                    [disabled]="isSubmitting"
                    style="resize: none;">
                </textarea>
            </div>
            
            <button 
                class="btn btn-primary btn-lg w-100 py-3 fw-bold shadow-sm" 
                (click)="submitDef()"
                [disabled]="!definition || definition.length < 5 || isSubmitting">
                <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                Submit Deception
            </button>
        </div>
        
        <ng-template #submittedState>
            <div class="alert alert-success bg-opacity-25 bg-success border-0 text-white animate-pulse">
                <i class="bi bi-check-circle-fill fs-1 d-block mb-3"></i>
                <h4 class="fw-bold">Definition Submitted!</h4>
                <p class="mb-0">Waiting for other players...</p>
            </div>
        </ng-template>
      </div>

      <!-- Phase: Voting -->
      <div *ngIf="gameData?.phase === 1" class="flex-grow-1 overflow-auto">
        <h3 class="mb-4 text-primary">Which one is REAL?</h3>
         
        <div *ngIf="hasVoted; else votingState" class="alert alert-info border-0">
             <h4 class="fw-bold">Vote Cast!</h4>
             <p>Waiting for results...</p>
        </div>

        <ng-template #votingState>
            <div class="d-grid gap-3">
                <button 
                    *ngFor="let def of getShuffledDefinitions(); let i = index"
                    class="btn btn-outline-light text-start p-3 border-2 position-relative"
                    [class.disabled]="def.id === myConnectionId"
                    (click)="submitVote(def.id)"
                    [disabled]="def.id === myConnectionId">
                    
                    <div class="d-flex align-items-center">
                        <span class="badge bg-secondary rounded-pill me-3">{{ getLetter(i) }}</span>
                        <span class="fs-5">{{ def.text }}</span>
                    </div>
                    
                    <span *ngIf="def.id === myConnectionId" class="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger">
                        YOURS
                    </span>
                </button>
            </div>
        </ng-template>
      </div>

      <!-- Phase: Result -->
      <div *ngIf="gameData?.phase === 2" class="flex-grow-1 d-flex align-items-center justify-content-center">
         <div class="text-center">
             <h3 class="text-secondary mb-4">Round Over</h3>
             <p class="lead">Look at the board for results!</p>
             <div class="spinner-border text-primary mt-3" role="status"></div>
         </div>
      </div>

    </div>
  `,
    styles: [`
    .animate-pulse { animation: pulse 2s infinite; }
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
  `]
})
export class PoppycockPlayerComponent implements OnChanges {
    @Input() room: any;
    @Input() myConnectionId: string = '';
    @Output() definitionSubmitted = new EventEmitter<string>();
    @Output() voteSubmitted = new EventEmitter<string>();

    gameData: any;
    definition: string = '';
    isSubmitting: boolean = false;

    // Local state to track if we've done the action for this phase
    // Note: Better to derive from Room state if possible, but for input text preservation:
    hasSubmitted: boolean = false;
    hasVoted: boolean = false;

    // Cache same as board for consistency if we want to show options here
    // IMPORTANT: The shuffling MUST BE CONSISTENT between Board and Player?
    // Actually, standard Jackbox style: Players just see buttons A, B, C on device, look at TV for text.
    // OR, for this mobile-first web app, we show text on phone too.
    // PROBLEM: If we shuffle randomly on client, Player A sees "A" as one text, Player B sees "A" as another.
    // CRITICAL FIX: Shuffling must be deterministic (seeded by Round ID or something) OR sent by server.
    // OR, simply show the full text on buttons, order doesn't matter as much, 
    // BUT we refer to "A", "B", "C". 
    // IF we want "Vote for A", the order MUST be same.
    // Solution: Board shuffles? No, Server sends definitions?
    // Current Backend sends Dictionary. Order is undefined.
    // QUICK FIX: Sort by Definition ID (PlayerId/REAL) alphabetically. Then it is consistent everywhere.

    shuffledDefinitions: any[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['room']) {
            const prevPhase = this.gameData?.phase;
            this.gameData = this.room?.gameData;

            if (this.gameData?.phase !== prevPhase) {
                // Reset local states on phase change
                if (this.gameData?.phase === 0) { // New Round Faking
                    this.hasSubmitted = false;
                    this.definition = '';
                    this.isSubmitting = false;
                }
                if (this.gameData?.phase === 1) { // Voting
                    this.hasVoted = false;
                    this.prepareDefinitions();
                }
            }
        }
    }

    submitDef() {
        this.isSubmitting = true;
        this.definitionSubmitted.emit(this.definition);
        this.hasSubmitted = true;
    }

    submitVote(targetId: string) {
        if (targetId === this.myConnectionId) return; // Prevent self vote
        this.voteSubmitted.emit(targetId);
        this.hasVoted = true;
    }

    getLetter(index: number): string {
        return String.fromCharCode(65 + index);
    }

    prepareDefinitions() {
        // Deterministic Sort for Consistency across clients
        // Collect Real + Fakes
        const defs = [];
        defs.push({ id: 'REAL', text: this.gameData.currentPrompt.realDefinition });

        if (this.gameData.playerSubmissions) {
            Object.entries(this.gameData.playerSubmissions).forEach(([pid, text]) => {
                defs.push({ id: pid, text: text as string });
            });
        }

        // Sort by text content to ensure same order on all devices? 
        // Or hash of ID?
        // Sorting by Text is safe enough for display order consistency.
        // Or safer: Sort by ID.
        defs.sort((a, b) => a.id.localeCompare(b.id));

        // Wait, but we want it Random so "REAL" isn't always first or based on ID.
        // We need a shared seed. The RoundNumber!
        // Simple seeded shuffle:
        this.shuffledDefinitions = this.seededShuffle(defs, this.room.roundNumber);
    }

    getShuffledDefinitions() {
        if (!this.shuffledDefinitions.length && this.gameData?.phase === 1) {
            this.prepareDefinitions();
        }
        return this.shuffledDefinitions;
    }

    seededShuffle(array: any[], seed: number) {
        const arr = [...array];
        let m = arr.length, t, i;

        // Simple PRNG
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        while (m) {
            i = Math.floor(random() * m--);
            t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
        }
        return arr;
    }
}
