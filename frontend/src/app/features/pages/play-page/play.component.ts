import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SignalRService } from '../../../services/signalr.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
    selector: 'app-play',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
    templateUrl: './play.component.html',
    styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, OnDestroy {
    rooms: any[] = [];
    loading = false;
    playerName = '';
    roomCode = '';
    games: GameDefinition[] = [];
    isValidating = false;
    codeError: string | null = null;

    async joinWithCode() {
        const cleanCode = this.roomCode ? this.roomCode.trim().toUpperCase() : '';
        if (!cleanCode || cleanCode.length !== 4) {
            this.codeError = 'Please enter a valid 4-letter room code.';
            return;
        }

        this.isValidating = true;
        this.codeError = null;

        try {
            const isValid = await this.signalRService.validateRoomCode(cleanCode);
            if (isValid) {
                this.router.navigate(['/game', cleanCode]);
            } else {
                this.codeError = `Room "${cleanCode}" not found. Check your code and try again.`;
                this.toastService.showError(`Room "${cleanCode}" does not exist.`);
            }
        } catch (err) {
            this.codeError = 'Unable to verify room code right now.';
            this.toastService.showError('Unable to verify room code.');
        } finally {
            this.isValidating = false;
        }
    }

    onCodeInput() {
        this.codeError = null;
    }

    constructor(
        private readonly signalRService: SignalRService,
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly toastService: ToastService,
        private readonly gameDataService: GameDataService,
        private readonly logger: LoggerService
    ) { }

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.playerName = user.displayName;
            } else {
                this.playerName = this.authService.getGuestName() || '';
            }
        });

        this.gameDataService.games$.subscribe(games => {
            if (games) {
                this.games = games;
            }
        });
        this.gameDataService.refreshGames();

        // Subscribe to real-time public rooms
        this.signalRService.publicRooms$.subscribe(rooms => {
            this.rooms = rooms;
            this.loading = false;
        });

        this.initLobby();
    }

    ngOnDestroy() {
        this.signalRService.leaveLobby();
    }

    async initLobby() {
        this.loading = true;
        try {
            await this.signalRService.joinLobby();
        } catch (e) {
            this.logger.error('Failed to join lobby stream', e);
            this.loading = false;
        }
    }

    async loadRooms() {
        // Refresh manually if needed, but separate from stream init
        this.loading = true;
        try {
            await this.signalRService.getPublicRooms();
        } catch (e) {
            this.logger.error('Failed to load rooms', e);
        } finally {
            this.loading = false;
        }
    }

    getHostName(players: any[]): string {
        const host = players.find(p => p.isHost);
        return host ? host.name : 'Unknown';
    }
}
