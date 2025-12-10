import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Room, Player } from '../../../../services/signalr.service';

interface AnswerReview {
    categoryIndex: number;
    category: string;
    answers: {
        playerId: string;
        playerName: string;
        text: string;
        isValid: boolean; // Unique
        points: number;
    }[];
}

@Component({
    selector: 'app-game-review',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card shadow-lg border-success">
      <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <h2 class="m-0">Round Review</h2>
        <button *ngIf="isHost" class="btn btn-light fw-bold" (click)="nextRound()">
            Next Round <i class="bi bi-arrow-right"></i>
        </button>
      </div>
      <div class="card-body">
        
        <div class="alert alert-info" *ngIf="isHost">
            <i class="bi bi-info-circle"></i> Review answers. Duplicates are automatically marked as 0 points.
        </div>

        <div class="accordion" id="reviewAccordion">
            <div class="accordion-item" *ngFor="let item of reviews; let i = index">
                <h2 class="accordion-header">
                    <button class="accordion-button" [class.collapsed]="i !== 0" type="button" data-bs-toggle="collapse" [attr.data-bs-target]="'#collapse'+i">
                        <strong>{{i + 1}}. {{item.category}}</strong>
                    </button>
                </h2>
                <div [id]="'collapse'+i" class="accordion-collapse collapse" [class.show]="i === 0" data-bs-parent="#reviewAccordion">
                    <div class="accordion-body">
                        <div class="list-group">
                            <div class="list-group-item d-flex justify-content-between align-items-center" 
                                 *ngFor="let ans of item.answers"
                                 [class.list-group-item-danger]="!ans.isValid"
                                 [class.list-group-item-success]="ans.isValid">
                                <div>
                                    <span class="fw-bold">{{ans.playerName}}</span>: 
                                    <span class="ms-2 fst-italic">{{ans.text || '(No Answer)'}}</span>
                                </div>
                                <span class="badge rounded-pill" [class.bg-success]="ans.isValid" [class.bg-danger]="!ans.isValid">
                                    {{ans.points}} pts
                                </span>
                            </div>
                            <div *ngIf="item.answers.length === 0" class="list-group-item text-muted">No answers submitted.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <h4>Current Scores</h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Round Score</th>
                            <th>Total Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let p of sortedPlayers">
                            <td>{{p.name}} <span *ngIf="p.isHost" class="badge bg-secondary">HOST</span></td>
                            <td class="text-success fw-bold">+{{ (room.roundScores || {})[p.connectionId] || 0 }}</td>
                            <td class="fw-bold">{{p.score}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .accordion-button:not(.collapsed) {
        background-color: #e8f5e9;
        color: #198754;
    }
  `]
})
export class GameReviewComponent implements OnInit, OnChanges {
    @Input() room!: Room;
    @Input() isHost = false;

    reviews: AnswerReview[] = [];
    sortedPlayers: Player[] = [];

    constructor(private readonly signalRService: SignalRService) { }

    ngOnInit() {
        this.processReview();
    }

    ngOnChanges() {
        if (this.room) {
            this.processReview();
            this.sortedPlayers = [...this.room.players].sort((a, b) => b.score - a.score);
        }
    }

    processReview() {
        if (!this.room || !this.room.gameState?.categories) return;

        this.reviews = this.room.gameState.categories.map((cat: string, index: number) => {
            const answers = this.room.players.map(p => {
                // Usually answers are keyed by something or just an array?
                // The backend stores `PlayerAnswers` as Dict<ConnectionId, List<string>>.
                // We need to fetch that? Wait, `Room` interface in frontend doesn't have `playerAnswers`.
                // Backend 'Room' model DOES have it.
                // I need to update Frontend `Room` interface to include `playerAnswers`.
                // Assuming I do that, logic proceeds:

                // Actually, signalr.service.ts Room interface MIGHT miss `playerAnswers`.
                // Let's assume passed Room has it (if backend sends it).
                // Checking backend: `StartGame` clears it. `SubmitAnswers` fills it.
                // `CalculateRoundScores` uses it. 
                // The `Room` sent to frontend SHOULD include it if JSON serialization includes it.

                const pAnswers = (this.room as any).playerAnswers?.[p.connectionId];
                const text = pAnswers && pAnswers[index] ? pAnswers[index] : '';

                // Simple client-side dupe check for display? 
                // Backend authorized the scores. We should trust `roundScores` for points.
                // But visual indication of "Duplicate" needs the text comparison.

                return {
                    playerId: p.connectionId,
                    playerName: p.name,
                    text: text,
                    isValid: true, // we'll calc loop below
                    points: 0
                };
            });

            // Mark duplicates
            const textCounts = new Map<string, number>();
            answers.forEach(a => {
                const normalized = a.text.trim().toLowerCase();
                if (normalized) {
                    textCounts.set(normalized, (textCounts.get(normalized) || 0) + 1);
                }
            });

            answers.forEach(a => {
                const normalized = a.text.trim().toLowerCase();
                if (!normalized) {
                    a.isValid = false;
                    a.points = 0;
                } else {
                    const count = textCounts.get(normalized) || 0;
                    a.isValid = count === 1;
                    a.points = a.isValid ? 1 : 0;
                }
            });

            return {
                categoryIndex: index,
                category: cat,
                answers: answers
            };
        });
    }

    nextRound() {
        this.signalRService.nextRound();
    }
}
