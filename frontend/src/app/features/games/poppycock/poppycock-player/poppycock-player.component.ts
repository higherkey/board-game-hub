import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../../../services/signalr.service';

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
    @Input() isHost: boolean = false;
    @Input() set playerId(v: string) {
        if (v) this.myConnectionId = v;
    }
    @Output() definitionSubmitted = new EventEmitter<string>();
    @Output() voteSubmitted = new EventEmitter<string>();

    gameData: any;
    definition: string = '';
    isSubmitting: boolean = false;

    hasSubmitted: boolean = false;
    hasVoted: boolean = false;

    shuffledDefinitions: any[] = [];

    constructor(private readonly signalRService: SignalRService) {}

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
        if (!this.definition || this.isSubmitting) return;
        this.isSubmitting = true;
        this.definitionSubmitted.emit(this.definition);
        this.signalRService.submitPoppycockDefinition(this.definition);
        this.hasSubmitted = true;
    }

    submitVote(targetId: string) {
        if (targetId === this.myConnectionId) return; // Prevent self vote
        this.voteSubmitted.emit(targetId);
        this.signalRService.submitPoppycockVote(targetId);
        this.hasVoted = true;
    }

    pauseGame() {
        this.signalRService.pauseGame();
    }

    resumeGame() {
        this.signalRService.resumeGame();
    }

    endRound() {
        this.signalRService.endRound();
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
