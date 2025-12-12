import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-just-one-board',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container text-center text-white">
      <h2 class="mb-4 display-4 text-warning">Just One</h2>

      <!-- Phase: Clue Giving -->
      <div *ngIf="gameData?.phase === 0" class="card bg-dark border-secondary p-4">
          <h3 class="mb-3">Round {{ room?.roundNumber }}</h3>
          <p class="lead">Target Word is defined! (Hidden from Guesser)</p>
          <div class="alert alert-info">
              Waiting for players to write their clues...
          </div>
          <div class="clue-counts mt-3">
             <h5>Clues Submitted: {{ getClueCount() }} / {{ getNonGuesserCount() }}</h5>
          </div>
          <!-- Show who is the guesser -->
          <div class="mt-4">
             <span class="badge bg-danger fs-5">Guesser: {{ getGuesserName() }}</span>
          </div>
      </div>

      <!-- Phase: Guessing / Elimination -->
      <div *ngIf="gameData?.phase === 1" class="card bg-dark border-secondary p-4">
          <h3 class="mb-3">Compare Clues</h3>
          <p class="text-muted">Duplicate clues have been eliminated!</p>
          
          <div class="row justify-content-center gap-3 mt-4">
              <!-- Valid Clues -->
              <div *ngFor="let clue of getValidClues()" class="col-auto">
                  <div class="card bg-light text-dark p-3" style="min-width: 150px;">
                      <!-- If clue is an image (Base64), show it, else text -->
                      <ng-container *ngIf="isBase64(clue.value); else textClue">
                          <img [src]="clue.value" class="img-fluid" style="max-height: 100px;">
                      </ng-container>
                      <ng-template #textClue>
                          <h4 class="m-0">{{ clue.value }}</h4>
                      </ng-template>
                      <small class="text-muted mt-2 d-block">{{ clue.player }}</small>
                  </div>
              </div>

              <!-- Invalid Clues (Visual feedback they were removed) -->
              <div *ngFor="let clue of getInvalidClues()" class="col-auto opacity-50">
                  <div class="card bg-secondary text-white p-3 position-relative" style="min-width: 150px;">
                      <ng-container *ngIf="isBase64(clue); else textInvalid">
                          <img [src]="clue" class="img-fluid" style="max-height: 100px; filter: grayscale(1);">
                      </ng-container>
                      <ng-template #textInvalid>
                          <h4 class="m-0 text-decoration-line-through">{{ clue }}</h4>
                      </ng-template>
                      <div class="position-absolute top-50 start-50 translate-middle">
                          <i class="bi bi-x-circle-fill text-danger fs-1"></i>
                      </div>
                  </div>
              </div>
          </div>

          <div class="mt-5">
              <h4>Waiting for <span class="text-warning">{{ getGuesserName() }}</span> to guess...</h4>
          </div>
      </div>

      <!-- Phase: Result -->
      <div *ngIf="gameData?.phase === 2" class="card bg-dark border-secondary p-4">
          <h1 class="display-3 mb-3" [class.text-success]="gameData?.result === 'Success'" [class.text-danger]="gameData?.result === 'Failure'">
              {{ gameData?.result }}!
          </h1>
          <h3 class="mb-4">Target Word: <span class="text-primary">{{ gameData?.targetWord }}</span></h3>
          <h4>Guesser answered: {{ gameData?.guesserResponse }}</h4>
      </div>
    </div>
  `
})
export class JustOneBoardComponent implements OnChanges {
    @Input() room: any;

    gameData: any;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['room']) {
            this.gameData = this.room?.gameData;
        }
    }

    getGuesserName(): string {
        const id = this.gameData?.guesserId;
        const p = this.room?.players?.find((x: any) => x.connectionId === id);
        return p ? p.name : 'Unknown';
    }

    getClueCount(): number {
        return this.gameData?.clues ? Object.keys(this.gameData.clues).length : 0;
    }

    getNonGuesserCount(): number {
        return (this.room?.players?.length || 1) - 1;
    }

    getValidClues(): { player: string, value: string }[] {
        if (!this.gameData?.clues) return [];
        const invalid = this.gameData.invalidClues || [];
        const result: { player: string, value: string }[] = [];

        const clueEntries = Object.entries(this.gameData.clues) as [string, string][]; // ID -> Clue

        clueEntries.forEach(([id, val]) => {
            if (!invalid.includes(val)) {
                const p = this.room.players.find((x: any) => x.connectionId === id);
                result.push({ player: p?.name || '?', value: val });
            }
        });
        return result;
    }

    getInvalidClues(): string[] {
        // Just return the unique invalid clues directly for display
        return this.gameData?.invalidClues || [];
    }

    isBase64(str: string): boolean {
        return str.startsWith('data:image');
    }
}
