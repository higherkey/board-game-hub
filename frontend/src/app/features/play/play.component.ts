import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
    selector: 'app-play',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
    templateUrl: './play.component.html',
    styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit {
    rooms: any[] = [];
    loading = false;
    playerName = '';
    roomCode = '';
    games: GameDefinition[] = [];

    showNameModal = false;
    tempPlayerName = '';
    pendingGameType?: string;

    constructor(
        private readonly signalRService: SignalRService,
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly toastService: ToastService,
        private readonly gameDataService: GameDataService
    ) { }

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.playerName = user.displayName;
            } else {
                this.playerName = this.authService.getGuestName() || '';
            }
        });

        this.gameDataService.loadGames().subscribe(games => {
            this.games = games;
        });

        this.loadRooms();
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

    getHostName(players: any[]): string {
        const host = players.find(p => p.isHost);
        return host ? host.name : 'Unknown';
    }

    async createRoom(gameType?: string) {
        if (this.playerName && this.playerName.trim().length > 0) {
            await this.proceedToCreateRoom(gameType || 'None');
            return;
        }

        this.pendingGameType = gameType || 'None';
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
        await this.proceedToCreateRoom(this.pendingGameType || 'None');
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
