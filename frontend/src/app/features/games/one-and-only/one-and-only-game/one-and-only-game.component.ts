import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../../services/signalr.service';
import { OneAndOnlyBoardComponent } from '../one-and-only-board/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from '../one-and-only-player/one-and-only-player.component';
import { OneAndOnlyRulesComponent } from '../one-and-only-rules/one-and-only-rules.component';

@Component({
    selector: 'app-one-and-only-game',
    standalone: true,
    imports: [CommonModule, OneAndOnlyBoardComponent, OneAndOnlyPlayerComponent, OneAndOnlyRulesComponent],
    templateUrl: './one-and-only-game.component.html',
    styleUrls: ['./one-and-only-game.component.scss']
})
export class OneAndOnlyGameComponent implements OnInit {
    @Input() room!: Room;
    @Input() myConnectionId: string = '';
    @Input() isHost: boolean = false;
    showRules = false;

    constructor(private readonly signalRService: SignalRService) { }

    ngOnInit(): void {
        if (this.room.roundNumber === 1 && !this.room.gameData) {
            this.showRules = true;
        }
    }

    onClueSubmitted(clue: string) {
        this.signalRService.submitClue(clue);
    }

    onGuessSubmitted(event: { guess: string, isPass: boolean }) {
        this.signalRService.submitGuess(event.guess, event.isPass);
    }
}
