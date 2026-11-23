import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GameRoomTab = 'game' | 'players';

@Component({
    selector: 'app-mobile-tab-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mobile-tab-bar.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
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
