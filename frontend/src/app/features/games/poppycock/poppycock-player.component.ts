import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-poppycock-player',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './poppycock-player.component.html',
    styleUrls: ['./poppycock-player.component.scss']
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

            // Sync submission state from server (important for "The Natural")
            if (this.isCorrectSubmission()) {
                this.hasSubmitted = true;
            }
        }
    }

    isCorrectSubmission(): boolean {
        return this.gameData?.correctSubmissions?.includes(this.myConnectionId);
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
        return String.fromCodePoint(65 + index);
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
