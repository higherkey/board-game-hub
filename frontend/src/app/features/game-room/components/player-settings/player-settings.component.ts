import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSettings, Room } from '../../../../services/signalr.service';
import { GameDefinition } from '../../../../services/game-data.service';
import { SoundService } from '../../../../core/services/sound.service';

@Component({
    selector: 'app-player-settings',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './player-settings.component.html',
    styleUrl: './player-settings.component.scss'
})
export class PlayerSettingsComponent {
    readonly soundService = inject(SoundService);

    @Input() roomCode!: string;
    @Input() room: Room | null = null;
    @Input() selectedGame: GameDefinition | undefined;
    @Input() meReady = false;
    @Input() isScreen = false;

    @Output() toggleReady = new EventEmitter<boolean | undefined>();

    get settings(): GameSettings | undefined {
        return this.room?.settings;
    }

    onToggleReady() {
        this.toggleReady.emit(undefined);
    }

    toggleSound() {
        this.soundService.toggleMute();
        this.soundService.playClick();
    }

    getQrCodeUrl(): string {
        const url = globalThis.location.origin + '/game/' + this.roomCode;
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}&bgcolor=ffffff`;
    }
}

