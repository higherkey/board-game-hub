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

        this.gameDataService.games$.subscribe(games => {
            if (games) {
                this.games = games;
            }
        });
        this.gameDataService.refreshGames();

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
}
