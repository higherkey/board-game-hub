import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../services/signalr.service';
import { AuthService } from '../../../services/auth.service';
import { IconBoardComponent } from './icon-board/icon-board.component';

@Component({
    selector: 'app-symbology',
    standalone: true,
    imports: [CommonModule, FormsModule, IconBoardComponent],
    templateUrl: './symbology.component.html',
    styleUrls: ['./symbology.component.scss']
})
export class SymbologyComponent {
    @Input() room!: Room;

    guess: string = '';
    get isActivePlayer(): boolean {
        return this.room?.gameData?.activePlayerId === this.signalR.getConnectionId();
    }

    get currentWord(): string {
        return this.room?.gameData?.currentWord || '';
    }

    // Scores helper? 
    // room.players[].score is updated by reference in room generic logic usually,
    // but if we want round scores we look at room.roundScores.

    constructor(
        private readonly signalR: SignalRService,
        private readonly auth: AuthService
    ) { }

    submitGuess() {
        if (!this.guess.trim()) return;
        this.signalR.submitGuess(this.guess);
        this.guess = '';
    }

    onMarkerPlaced(event: { icon: string, type: string, color: string }) {
        this.signalR.symbologyPlaceMarker(event.icon, event.type, event.color);
    }

    onMarkerRemoved(markerId: string) {
        this.signalR.symbologyRemoveMarker(markerId);
    }
}
