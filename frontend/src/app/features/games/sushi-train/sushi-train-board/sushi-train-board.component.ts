import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../../services/signalr.service';
import { SushiTrainRulesComponent } from '../sushi-train-rules/sushi-train-rules.component';

@Component({
    selector: 'app-sushi-train-board',
    standalone: true,
    imports: [CommonModule, SushiTrainRulesComponent],
    templateUrl: './sushi-train-board.component.html',
    styleUrls: ['./sushi-train-board.component.scss']
})
export class SushiTrainBoardComponent {
    @Input() room: Room | null = null;
    @Input() isHost: boolean = false;

    showRules = false;

    constructor(private readonly signalRService: SignalRService) { }

    get gameState() { return this.room?.gameData; }
    get players() { return this.room?.players || []; }

    getCardEmoji(type: string): string {
        const map: any = {
            'NigiriEgg': '🥚', 'NigiriSalmon': '🍣', 'NigiriSquid': '🦑',
            'Wasabi': '🥣', 'Maki1': '🍙', 'Maki2': '🍙🍙', 'Maki3': '🍙🍙🍙',
            'Tempura': '🍤', 'Sashimi': '🐟', 'Dumpling': '🥟',
            'Pudding': '🍮', 'Chopsticks': '🥢'
        };
        return map[type] || '❓';
    }

    getCardName(type: string): string {
        const map: any = {
            'NigiriEgg': 'Egg Nigiri (1)', 'NigiriSalmon': 'Salmon Nigiri (2)', 'NigiriSquid': 'Squid Nigiri (3)',
            'Wasabi': 'Wasabi (x3)', 'Maki1': 'Maki (1)', 'Maki2': 'Maki (2)', 'Maki3': 'Maki (3)',
            'Tempura': 'Tempura (x2=5)', 'Sashimi': 'Sashimi (x3=10)', 'Dumpling': 'Dumpling',
            'Pudding': 'Pudding', 'Chopsticks': 'Chopsticks'
        };
        return map[type] || type;
    }

    getPlayerState(playerId: string) {
        return this.gameState?.playerStates?.[playerId];
    }

    nextRound() {
        this.signalRService.nextRound();
    }

    restartGame() {
        this.signalRService.startGame();
    }
}
