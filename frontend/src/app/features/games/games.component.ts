import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../services/signalr.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
    selector: 'app-games',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './games.component.html',
    styleUrls: ['./games.component.scss']
})
export class GamesComponent implements OnInit {
    rooms: any[] = [];
    loading = false;
    playerName = '';
    roomCode = '';

    games: GameDefinition[] = [];

    constructor(
        private readonly signalRService: SignalRService,
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly gameDataService: GameDataService,
        private readonly toastService: ToastService
    ) { }

    ngOnInit() {
        console.log('Games Component Initialized');
        this.gameDataService.loadGames().subscribe(games => {
            this.games = [...games].sort((a, b) => {
                // Sort by status: Deployed (0) first, checking for string 'Deployed'
                if (a.status === 'Deployed' && b.status !== 'Deployed') return -1;
                if (a.status !== 'Deployed' && b.status === 'Deployed') return 1;
                return 0;
            });
        });
        this.loadRooms();

        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.playerName = user.displayName;
            } else {
                // Use guest name if available
                this.playerName = this.authService.getGuestName() || '';
            }
        });
    }

    async loadRooms() {
        this.loading = true;
        try {
            if (this.signalRService.connectionStatus$.value !== 'Connected') {
                await this.signalRService.startConnection();
            }
            this.rooms = await this.signalRService.getPublicRooms();
        } catch (e) {
            console.error('Failed to load rooms', e);
        } finally {
            this.loading = false;
        }
    }

    showNameModal = false;
    tempPlayerName = '';
    pendingGameType?: string;

    getHostName(players: any[]): string {
        const host = players.find(p => p.isHost);
        return host ? host.name : 'Unknown';
    }

    async createRoom(gameType?: string) {
        // If user is authenticated OR has a saved guest name, proceed directly
        if (this.playerName && this.playerName.trim().length > 0) {
            await this.proceedToCreateRoom(gameType || 'Scatterbrain');
            return;
        }

        // Otherwise show modal to capture name
        this.pendingGameType = gameType || 'Scatterbrain';
        this.tempPlayerName = '';
        this.showNameModal = true;
    }

    async confirmCreateRoom() {
        if (!this.tempPlayerName) return;

        this.playerName = this.tempPlayerName;
        if (!this.authService.currentUserValue) {
            this.authService.setGuestName(this.playerName);
        }
        this.showNameModal = false;
        await this.proceedToCreateRoom(this.pendingGameType || 'Scatterbrain');
    }

    cancelCreateRoom() {
        this.showNameModal = false;
        this.pendingGameType = undefined;
        this.tempPlayerName = '';
    }

    private async proceedToCreateRoom(gameType: string) {
        try {
            if (this.signalRService.connectionStatus$.value !== 'Connected') {
                await this.signalRService.startConnection();
            }

            const code = await this.signalRService.createRoom(this.playerName, true, gameType);
            this.router.navigate(['/game', code]);
        } catch (e) {
            console.error('Error creating room', e);
            this.toastService.showError('Error creating room. Please try again.');
        }
    }

    async joinRoom(code: string) {
        if (!code) return;
        try {
            const success = await this.signalRService.joinRoom(code, this.playerName);
            if (success) {
                this.router.navigate(['/game', code]);
            } else {
                this.toastService.showError('Room not found or full.');
            }
        } catch (e) {
            console.error('Error joining room', e);
            this.toastService.showError('Could not join room. Please check the code.');
        }
    }
}
