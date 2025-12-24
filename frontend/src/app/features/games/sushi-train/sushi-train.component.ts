import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../../services/signalr.service';
import { SushiRulesComponent } from './sushi-rules.component';

@Component({
    selector: 'app-sushi-train',
    standalone: true,
    imports: [CommonModule, SushiRulesComponent],
    templateUrl: './sushi-train.component.html',
    styleUrls: ['./sushi-train.component.scss']
})
export class SushiTrainComponent {
    @Input() room: Room | null = null;
    showRules = false;

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

}
