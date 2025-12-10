import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../services/signalr.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

    constructor(
        private readonly signalRService: SignalRService,
        private readonly router: Router,
        private readonly authService: AuthService
    ) { }

    ngOnInit() {
        console.log('Games Component Initialized');
        this.loadRooms();

        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.playerName = user.displayName;
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

    getHostName(players: any[]): string {
        const host = players.find(p => p.isHost);
        return host ? host.name : 'Unknown';
    }

    async createRoom(gameType: string) {
        let name = this.playerName;

        if (!name) {
            name = this.getPlayerName();
        }

        if (!name) return;

        try {
            if (this.signalRService.connectionStatus$.value !== 'Connected') {
                await this.signalRService.startConnection();
            }
            // Create room with Game Type
            const code = await this.signalRService.createRoom(name, true, gameType);

            this.router.navigate(['/game', code], { queryParams: { name: name } });
        } catch (e) {
            console.error('Error creating room', e);
            alert('Error creating room. Please try again.');
        }
    }

    async joinRoom(code: string) {
        if (!code) return;
        try {
            const success = await this.signalRService.joinRoom(code, this.playerName);
            if (success) {
                this.router.navigate(['/game', code], { queryParams: { name: this.playerName } });
            } else {
                alert('Room not found or full.');
            }
        } catch (e) {
            console.error('Error joining room', e);
            alert('Could not join room. Please check the code.');
        }
    }
    getPlayerName(): string {
        return prompt("Enter your name to host:") || '';
    }
}
