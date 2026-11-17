import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FourInARowRoom } from '../four-in-a-row.models';
import { FourInARowBoardComponent } from '../four-in-a-row-board/four-in-a-row-board.component';

@Component({
    selector: 'app-four-in-a-row-player',
    standalone: true,
    imports: [CommonModule, FourInARowBoardComponent],
    templateUrl: './four-in-a-row-player.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./four-in-a-row-player.component.scss']
})
export class FourInARowPlayerComponent {
    @Input() room?: FourInARowRoom;
    @Output() columnDrop = new EventEmitter<number>();

    get canPlay(): boolean {
        const state = this.room?.gameData;
        return !!state && state.phase === 'Playing' && this.room?.state === 'Playing' && !this.room.isPaused &&
            state.currentPlayerId === this.myConnectionId &&
            !!this.room.players.some(p => p.connectionId === this.myConnectionId && !p.isScreen);
    }
    @Input() myConnectionId: string = '';
}
