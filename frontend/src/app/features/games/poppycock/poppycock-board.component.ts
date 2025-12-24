import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoppycockRulesComponent } from './poppycock-rules.component';

@Component({
    selector: 'app-poppycock-board',
    standalone: true,
    imports: [CommonModule, PoppycockRulesComponent],
    template: `
    <div class="w-100 text-center position-relative">
      
      <!-- Rules Overlay -->
      <div *ngIf="showRules" class="rules-overlay d-flex align-items-center justify-content-center p-3">
        <app-poppycock-rules (dismiss)="showRules = false"></app-poppycock-rules>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4">
        <div style="width: 40px;"></div> <!-- Spacer -->
        <h2 class="display-4 text-primary font-serif mb-0">Poppycock</h2>
        <button class="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" 
                style="width: 40px; height: 40px;"
                (click)="showRules = !showRules">
          <i class="bi bi-question-lg"></i>
        </button>
      </div>

      <!-- Phase: Faking -->
      <div *ngIf="gameData?.phase === 0" class="card bg-surface shadow-md border-0 p-5 mb-4">
        <h4 class="text-uppercase text-secondary mb-3 tracking-wider">{{ gameData?.currentPrompt?.category }}</h4>
        <h1 class="display-2 fw-bold text-accent mb-4">{{ gameData?.currentPrompt?.word }}</h1>
        
        <div class="d-flex justify-content-center mb-4">
            <div class="px-4 py-2 bg-info bg-opacity-10 rounded-pill border border-info border-opacity-25">
                <span class="text-info fw-bold"><i class="bi bi-person-badge me-2"></i>Dasher: {{ getDasherName() }}</span>
            </div>
        </div>

        <div class="alert alert-info border-0 bg-info bg-opacity-10 text-primary fw-bold fs-5">
           <div class="spinner-border spinner-border-sm me-2" role="status"></div>
           Waiting for definitions... ({{ getSubmissionCount() }} / {{ getExpectedSubmissionCount() }})
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
        
        <div class="mt-4 d-flex justify-content-center gap-4">
            <h5 class="text-secondary">Votes: {{ getVoteCount() }} / {{ getExpectedVoteCount() }}</h5>
            <div *ngIf="gameData?.correctSubmissions?.length" class="text-success fw-bold">
                <i class="bi bi-lightning-fill me-1"></i> {{ gameData.correctSubmissions.length }} already knew it!
            </div>
        </div>
      </div>

      <!-- Phase: Result -->
      <div *ngIf="gameData?.phase === 2" class="card bg-surface shadow-md border-0 p-4 mb-4 reveal-anim">
        <h1 class="display-4 mb-4 fw-bold text-primary">The Truth Revealed</h1>
        
        <div class="row g-4">
            <!-- The Real Definition -->
            <div class="col-12 reveal-stagger delay-1">
                <div class="card bg-success bg-opacity-10 border-success border-opacity-25 shadow-sm p-4 text-center">
                    <h4 class="text-success text-uppercase tracking-wider mb-2">Real Definition</h4>
                    <p class="display-6 fw-bold text-white mb-0">{{ gameData?.currentPrompt?.realDefinition }}</p>
                    <div class="mt-3" *ngIf="getVotesByTarget('REAL').length">
                        <span class="badge bg-success rounded-pill px-3 py-2 me-2" *ngFor="let v of getVotesByTarget('REAL')">{{ v.voterName }}</span>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card bg-base border-0 shadow p-3 h-100">
                     <h4 class="text-secondary mb-3 border-bottom pb-2">Bluffs Caught</h4>
                     <ul class="list-group list-group-flush">
                          <li *ngFor="let result of getFakeResults()" class="list-group-item bg-transparent d-flex justify-content-between align-items-center">
                             <span>
                                <strong>{{ result.voterName }}</strong> fell for 
                                <span class="badge bg-danger">{{ result.authorName }}</span>
                             </span>
                             <span class="text-accent fw-bold">+2 to {{ result.authorName }}</span>
                         </li>
                     </ul>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card bg-base border-0 shadow p-3 h-100">
                     <h4 class="text-secondary mb-3 border-bottom pb-2">The Naturals</h4>
                     <p *ngIf="!gameData?.correctSubmissions?.length" class="text-muted italic small text-center my-4">No one knew it immediately...</p>
                     <ul class="list-group list-group-flush">
                         <li *ngFor="let pid of gameData?.correctSubmissions" class="list-group-item bg-transparent d-flex justify-content-between align-items-center">
                             <span class="fw-bold text-primary">{{ getPlayerName(pid) }}</span>
                             <span class="badge bg-info text-dark">+3 Bonus</span>
                         </li>
                     </ul>

                     <!-- Dasher Bonus -->
                     <div class="mt-4 p-3 bg-warning bg-opacity-10 rounded-3 text-center" *ngIf="isDasherPenalty()">
                        <h5 class="text-warning mb-1">Dasher Bonus!</h5>
                        <p class="small text-white-50 mb-0">No one guessed correctly! {{ getDasherName() }} gets <strong>+3 pts</strong>.</p>
                     </div>
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
    .rules-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .reveal-anim {
      animation: revealSlide 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes revealSlide {
      0% { transform: translateY(30px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .reveal-stagger {
      animation: revealSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .delay-1 { animation-delay: 0.2s; }
    .delay-2 { animation-delay: 0.4s; }
    .delay-3 { animation-delay: 0.6s; }
  `]
})
export class PoppycockBoardComponent implements OnChanges {
    @Input() room: any;
    gameData: any;
    showRules: boolean = false;

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
        if (this.shuffledDefinitions.length === 0 && this.gameData?.phase === 1) {
            this.prepareDefinitions();
        }
        return this.shuffledDefinitions;
    }

    getLetter(index: number): string {
        return String.fromCodePoint(65 + index); // A, B, C...
    }

    getDasherName(): string {
        if (!this.gameData?.dasherId) return 'System';
        const dasher = this.room.players.find((p: any) => p.connectionId === this.gameData.dasherId);
        return dasher ? dasher.name : 'Unknown';
    }

    getExpectedSubmissionCount(): number {
        // Everyone except Dasher must submit
        return Math.max(0, (this.room?.players?.length || 0) - 1);
    }

    getExpectedVoteCount(): number {
        // Everyone except Dasher and those who got Natural
        const naturals = this.gameData?.correctSubmissions?.length || 0;
        return Math.max(0, (this.room?.players?.length || 0) - 1 - naturals);
    }

    getPlayerName(id: string): string {
        const p = this.room.players.find((p: any) => p.connectionId === id);
        return p ? p.name : 'Unknown';
    }

    getVotesByTarget(targetId: string) {
        if (!this.gameData?.votes) return [];
        return Object.entries(this.gameData.votes)
            .filter(([_, target]) => target === targetId)
            .map(([voterId, _]) => ({
                voterId,
                voterName: this.getPlayerName(voterId)
            }));
    }

    getFakeResults() {
        if (!this.gameData?.votes) return [];
        const results: any[] = [];
        Object.entries(this.gameData.votes).forEach(([voterId, targetId]) => {
            if (targetId !== 'REAL') {
                results.push({
                    voterName: this.getPlayerName(voterId),
                    authorName: this.getPlayerName(targetId as string)
                });
            }
        });
        return results;
    }

    isDasherPenalty(): boolean {
        // Bonus to Dasher if no one guessed it right
        const votesForReal = Object.values(this.gameData?.votes || {}).filter(v => v === 'REAL').length;
        const naturals = this.gameData?.correctSubmissions?.length || 0;
        return (votesForReal + naturals) === 0;
    }

    getResults() {
        // This method is now replaced by granular ones like getFakeResults
        return [];
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
