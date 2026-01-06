import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OneAndOnlyRulesComponent } from '../one-and-only-rules/one-and-only-rules.component';

@Component({
    selector: 'app-one-and-only-board',
    standalone: true,
    imports: [CommonModule, OneAndOnlyRulesComponent],
    templateUrl: './one-and-only-board.component.html',
    styleUrls: ['./one-and-only-board.component.scss']
})
export class OneAndOnlyBoardComponent implements OnChanges {
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

        const clueEntries = Object.entries(this.gameData.clues); // ID -> Clue

        clueEntries.forEach(([id, val]) => {
            if (!invalid.includes(val)) {
                const p = this.room.players.find((x: any) => x.connectionId === id);
                result.push({ player: p?.name || '?', value: val as string });
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
