import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameDefinition } from '../../../services/game-data.service';
import { GameSettings, Player, Room } from '../../../services/signalr.service';
import { HostSettingsComponent } from '../../game-room/components/host-settings/host-settings.component';

@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [CommonModule, FormsModule, HostSettingsComponent],
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent {
    @Input() room: Room | null = null;
    @Input() players: Player[] | null = null; // Direct stream
    @Input() isHost = false;
    @Input() availableGames: GameDefinition[] = [];
    @Input() selectedGameType = 'None';
    @Input() connectionId: string | null = null;
    @Input() isScreen = false;

    @Output() gameSelected = new EventEmitter<string>();
    @Output() toggleReady = new EventEmitter<void>();
    @Output() startGame = new EventEmitter<GameSettings>();
    @Output() setHost = new EventEmitter<string>();
    @Output() changeRole = new EventEmitter<boolean>();

    // Mobile tab state
    mobileTab: 'games' | 'players' | 'settings' = 'games';

    constructor() { }

    get selectedGameDef(): GameDefinition | undefined {
        if (!this.selectedGameType || this.selectedGameType === 'None') return undefined;
        return this.availableGames.find(g => g.id === this.selectedGameType);
    }

    getPlayers(): Player[] {
        return (this.players || []).filter(p => !p.isScreen);
    }

    getTables(): Player[] {
        return (this.players || []).filter(p => p.isScreen);
    }

    getMyPlayer(): Player | undefined {
        return (this.players || []).find(p => p.connectionId === this.connectionId);
    }

    onSelectGame(gameId: string) {
        if (this.isHost) {
            this.gameSelected.emit(gameId);
        }
    }

    onToggleReady() {
        this.toggleReady.emit();
    }

    onStartGame(settings: any) {
        this.startGame.emit(settings as GameSettings);
    }

    onSetHost(playerId: string) {
        this.setHost.emit(playerId);
    }

    onChangeRole(isScreen: boolean) {
        this.changeRole.emit(isScreen);
    }

    setMobileTab(tab: 'games' | 'players' | 'settings') {
        this.mobileTab = tab;
    }
}
