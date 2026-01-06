import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../../services/signalr.service';
import { PoppycockBoardComponent } from '../poppycock-board/poppycock-board.component';
import { PoppycockPlayerComponent } from '../poppycock-player/poppycock-player.component';
import { PoppycockRulesComponent } from '../poppycock-rules/poppycock-rules.component';

@Component({
    selector: 'app-poppycock-game',
    standalone: true,
    imports: [CommonModule, PoppycockBoardComponent, PoppycockPlayerComponent, PoppycockRulesComponent],
    templateUrl: './poppycock-game.component.html',
    styleUrls: ['./poppycock-game.component.scss']
})
export class PoppycockGameComponent implements OnInit {
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

    onDefinitionSubmitted(def: string) {
        this.signalRService.submitPoppycockDefinition(def);
    }

    onVoteSubmitted(vote: string) {
        this.signalRService.submitPoppycockVote(vote);
    }
}
