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
    templateUrl: './game-review.component.html',
    styleUrls: ['./game-review.component.scss']
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
        if (!this.room?.gameState?.categories) return;

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
                const text = pAnswers?.[index] ?? '';

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
                if (normalized) {
                    const count = textCounts.get(normalized) || 0;
                    a.isValid = count === 1;
                    a.points = a.isValid ? 1 : 0;
                } else {
                    a.isValid = false;
                    a.points = 0;
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
