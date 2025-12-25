import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoppycockRulesComponent } from './poppycock-rules.component';

@Component({
    selector: 'app-poppycock-board',
    standalone: true,
    imports: [CommonModule, PoppycockRulesComponent],
    templateUrl: './poppycock-board.component.html',
    styleUrls: ['./poppycock-board.component.scss']
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
