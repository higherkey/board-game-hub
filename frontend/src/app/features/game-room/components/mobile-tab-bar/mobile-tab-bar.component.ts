import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GameRoomTab = 'game' | 'players';

@Component({
    selector: 'app-mobile-tab-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mobile-tab-bar.component.html',
    styleUrls: ['./mobile-tab-bar.component.scss']
})
export class MobileTabBarComponent {
    @Input() activeTab: GameRoomTab = 'game';
    @Input() isHost = false;
    @Output() tabChange = new EventEmitter<GameRoomTab>();

    selectTab(tab: GameRoomTab) {
        this.tabChange.emit(tab);
    }
}
