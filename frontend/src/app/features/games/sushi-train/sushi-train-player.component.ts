import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../services/signalr.service';

@Component({
    selector: 'app-sushi-train-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './sushi-train-player.component.html',
    styleUrls: ['./sushi-train-player.component.scss']
})
export class SushiTrainPlayerComponent {
    @Input() gameState: any;
    @Input() currentUserId: string = '';

    selectedId: string | null = null;

    constructor(private readonly signalRService: SignalRService) { }

    get myState() {
        return this.gameState?.playerStates?.[this.currentUserId];
    }

    get myHand() {
        return this.myState?.hand || [];
    }

    get hasChopsticksInTableau(): boolean {
        return this.myState?.tableau?.some((c: any) => c.type === 'Chopsticks') || false;
    }

    get isUsingChopsticks(): boolean {
        return this.myState?.isUsingChopsticks || false;
    }

    get selectedCount(): number {
        let count = 0;
        if (this.myState?.selectedCardId) count++;
        if (this.myState?.selectedCardId2) count++;
        return count;
    }

    toggleChopsticks() {
        if (this.myState?.hasSelected) return;
        this.signalRService.toggleSushiTrainChopsticks();
    }

    selectCard(cardId: string) {
        if (this.myState?.hasSelected) return;

        // Prevent selecting the same card twice if using chopsticks
        if (this.isUsingChopsticks && this.myState?.selectedCardId === cardId) return;

        this.signalRService.submitSushiTrainSelection(cardId);
    }

    isCardSelected(cardId: string): boolean {
        return this.myState?.selectedCardId === cardId || this.myState?.selectedCardId2 === cardId;
    }

    getCardEmoji(type: string): string {
        const map: any = {
            'NigiriEgg': '🥚', 'NigiriSalmon': '🍣', 'NigiriSquid': '🦑',
            'Wasabi': '🥣', 'Maki1': '🍙', 'Maki2': '🍙🍙', 'Maki3': '🍙🍙🍙',
            'Tempura': '🍤', 'Sashimi': '🐟', 'Dumpling': '🥟',
            'Pudding': '🍮', 'Chopsticks': '🥢'
        };
        return map[type] || '❓';
    }

    getCardDesc(type: string): string {
        const map: any = {
            'NigiriEgg': '1 Point', 'NigiriSalmon': '2 Points', 'NigiriSquid': '3 Points',
            'Wasabi': 'Next Nigiri x3', 'Maki1': 'Most Wins', 'Maki2': 'Most Wins', 'Maki3': 'Most Wins',
            'Tempura': '2x = 5pts', 'Sashimi': '3x = 10pts', 'Dumpling': '1,3,6,10,15',
            'Pudding': 'Most = +6 (End)', 'Chopsticks': 'Pick 2 later'
        };
        return map[type] || '';
    }

    getCardName(type: string): string {
        const map: any = {
            'NigiriEgg': 'Egg', 'NigiriSalmon': 'Salmon', 'NigiriSquid': 'Squid',
            'Wasabi': 'Wasabi', 'Maki1': 'Maki (1)', 'Maki2': 'Maki (2)', 'Maki3': 'Maki (3)',
            'Tempura': 'Tempura', 'Sashimi': 'Sashimi', 'Dumpling': 'Dumpling',
            'Pudding': 'Pudding', 'Chopsticks': 'Chopsticks'
        };
        return map[type] || type;
    }
}
