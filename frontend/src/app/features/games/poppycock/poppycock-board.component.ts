import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-poppycock-board',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="w-100 text-center">
      <h2 class="mb-4 display-4 text-primary font-serif">Poppycock</h2>

      <!-- Phase: Faking -->
      <div *ngIf="gameData?.phase === 0" class="card bg-surface shadow-md border-0 p-5 mb-4">
        <h4 class="text-uppercase text-secondary mb-3 tracking-wider">{{ gameData?.currentPrompt?.category }}</h4>
        <h1 class="display-2 fw-bold text-accent mb-5">{{ gameData?.currentPrompt?.word }}</h1>
        
        <div class="alert alert-info border-0 bg-info bg-opacity-10 text-primary fw-bold fs-5">
           <div class="spinner-border spinner-border-sm me-2" role="status"></div>
           Waiting for definitions... ({{ getSubmissionCount() }} / {{ getPlayerCount() }})
        </div>
      </div>

      <!-- Phase: Voting -->
      <div *ngIf="gameData?.phase === 1" class="card bg-surface shadow-md border-0 p-4 mb-4">
        <h3 class="mb-2 text-primary">Vote for the Real Definition</h3>
        <h2 class="mb-4 text-accent fw-bold">{{ gameData?.currentPrompt?.word }}</h2>
        
        <div class="row g-3 justify-content-center">
           <div *ngFor="let def of getShuffledDefinitions(); let i = index" class="col-12 col-md-8">
              <div class="card bg-base border-0 shadow-sm p-3 text-start hover-effect">
                  <div class="d-flex align-items-center">
                      <div class="badge bg-primary rounded-circle fs-4 me-3" style="width: 40px; height: 40px; display:flex; align-items:center; justify-content:center;">
                          {{ getLetter(i) }}
                      </div>
                      <p class="m-0 fs-5 lead">{{ def.text }}</p>
                  </div>
              </div>
           </div>
        </div>
        
        <div class="mt-4">
            <h5 class="text-secondary">Votes: {{ getVoteCount() }} / {{ getPlayerCount() }}</h5>
        </div>
      </div>

      <!-- Phase: Result -->
      <div *ngIf="gameData?.phase === 2" class="card bg-surface shadow-md border-0 p-4 mb-4">
        <h1 class="display-3 mb-4 fw-bold text-primary">The Truth Revealed</h1>
        
        <div class="row g-4">
            <div class="col-md-6">
                <div class="card bg-success text-white border-0 shadow p-4 h-100">
                    <h3 class="mb-3 text-white-50"><i class="bi bi-check-circle-fill me-2"></i>Real Definition</h3>
                    <p class="fs-4">{{ gameData?.currentPrompt?.realDefinition }}</p>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card bg-base border-0 shadow p-3 h-100">
                     <h4 class="text-secondary mb-3">Who fooled who?</h4>
                     <ul class="list-group list-group-flush">
                         <li *ngFor="let result of getResults()" class="list-group-item bg-transparent d-flex justify-content-between align-items-center">
                             <span>
                                <strong>{{ result.voterName }}</strong> voted for 
                                <span class="badge" [ngClass]="result.isCorrect ? 'bg-success' : 'bg-danger'">
                                    {{ result.authorName }}
                                </span>
                             </span>
                             <span *ngIf="result.isCorrect" class="text-success fw-bold">+2 Pts</span>
                             <span *ngIf="!result.isCorrect && result.authorName !== 'System'" class="text-accent fw-bold">
                                 Deceived (+1 to Author)
                             </span>
                         </li>
                     </ul>
                </div>
            </div>
        </div>
      </div>

    </div>
  `,
    styles: [`
    .font-serif { font-family: 'Merriweather', serif; }
    .tracking-wider { letter-spacing: 0.1em; }
    .hover-effect { transition: transform 0.2s; }
  `]
})
export class PoppycockBoardComponent implements OnChanges {
    @Input() room: any;
    gameData: any;

    // Cache check for shuffled definitions to avoid reshuffling on every change detection if phase is same
    // Ideally, backend determines ID, but for MVP frontend shuffle is okay if consistent? 
    // Wait, if board re-renders, it might reshuffle. 
    // Better to use a stable sort or just deterministic based on content hash.
    // Or just shuffle once when entering phase 1.
    shuffledDefinitions: any[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['room']) {
            const prevPhase = this.gameData?.phase;
            this.gameData = this.room?.gameData;

            if (this.gameData?.phase === 1 && prevPhase !== 1) {
                this.prepareDefinitions();
            }
        }
    }

    getPlayerCount(): number {
        return this.room?.players?.length || 0;
    }

    getSubmissionCount(): number {
        return this.gameData?.playerSubmissions ? Object.keys(this.gameData.playerSubmissions).length : 0;
    }

    getVoteCount(): number {
        return this.gameData?.votes ? Object.keys(this.gameData.votes).length : 0;
    }

    prepareDefinitions() {
        // Collect Real + Fakes
        const defs = [];
        // Real
        defs.push({ id: 'REAL', text: this.gameData.currentPrompt.realDefinition });

        // Fakes
        if (this.gameData.playerSubmissions) {
            Object.entries(this.gameData.playerSubmissions).forEach(([pid, text]) => {
                defs.push({ id: pid, text: text });
            });
        }

        // Shuffle
        this.shuffledDefinitions = this.shuffleArray(defs);
    }

    getShuffledDefinitions() {
        // Return cached
        // If empty and we are in phase 1 (maybe loaded directly), prepare
        if (this.shuffledDefinitions.length === 0 && this.gameData?.phase === 1) {
            this.prepareDefinitions();
        }
        return this.shuffledDefinitions;
    }

    getLetter(index: number): string {
        return String.fromCharCode(65 + index); // A, B, C...
    }

    getResults() {
        // Map votes to names
        // Votes: VoterId -> TargetId
        if (!this.gameData?.votes) return [];

        const results = [];
        for (const [voterId, targetId] of Object.entries(this.gameData.votes)) {
            const voter = this.room.players.find((p: any) => p.connectionId === voterId);

            let authorName = 'Unknown';
            let isCorrect = false;

            if (targetId === 'REAL') {
                authorName = 'The Truth';
                isCorrect = true;
            } else {
                const author = this.room.players.find((p: any) => p.connectionId === targetId);
                authorName = author ? author.name : 'Unknown';
            }

            results.push({
                voterName: voter ? voter.name : 'Unknown',
                authorName: authorName,
                isCorrect: isCorrect
            });
        }
        return results;
    }

    private shuffleArray(array: any[]) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
