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

    games = [
        {
            id: 'Scatterbrain',
            name: 'Scatterbrain',
            icon: '🧠',
            description: 'The classic party game. Come up with unique answers for categories for a chosen letter.',
            active: true
        },
        {
            id: 'Boggle',
            name: 'Boggle',
            icon: '🔤',
            description: 'Find as many words as you can in the grid of letters before time runs out!',
            active: true
        },
        { id: 'Codenames', name: 'Codenames', icon: '🕵️‍♀️', description: 'Give one-word clues to help your team guess their agents.', active: false },
        { id: 'Spyfall', name: 'Spyfall', icon: '🕵️', description: 'Find the spy among you before they figure out the location.', active: false },
        { id: 'Pictionary', name: 'Pictionary', icon: '🎨', description: 'Draw and guess words with your friends.', active: false },
        { id: 'Uno', name: 'Uno', icon: '🃏', description: 'The classic card game of matching colors and numbers.', active: false },
        { id: 'Scrabble', name: 'Scrabble', icon: '📝', description: ' Create words on the board using letter tiles.', active: false },
        { id: 'Monopoly', name: 'Monopoly', icon: '🎩', description: 'Buy, sell, and trade properties to win.', active: false },
        { id: 'Catan', name: 'Settlers of Catan', icon: '🏰', description: 'Trade, build, and settle the island of Catan.', active: false },
        { id: 'TicketToRide', name: 'Ticket to Ride', icon: '🚂', description: 'Build train routes across the country.', active: false },
        { id: 'Battleship', name: 'Battleship', icon: '🚢', description: 'Sink your opponent\'s fleet before they sink yours.', active: false },
        { id: 'Connect4', name: 'Connect 4', icon: '🔴', description: 'Connect four of your checkers in a row.', active: false },
        { id: 'Checkers', name: 'Checkers', icon: '🏁', description: 'Jump over opponent pieces to capture them.', active: false },
        { id: 'Chess', name: 'Chess', icon: '♟️', description: 'Strategic board game played on a checkered board.', active: false }
    ];

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

    async createRoom(gameType?: string) {
        let name = this.playerName;

        if (!name) {
            name = this.getPlayerName();
        }

        if (!name) return;

        try {
            if (this.signalRService.connectionStatus$.value !== 'Connected') {
                await this.signalRService.startConnection();
            }
            // Create room with Game Type (default to Scatterbrain if generic? Or handle in backend?)
            // If gameType is undefined, backend currently defaults to Scatterbrain anyway in the signature, 
            // OR we can pass a specific 'Lobby' type if we want no game selected?
            // For now, let's default to 'Scatterbrain' if specific button clicked, or 'Scatterbrain' if generic 
            // BUT user wants generic "Create Room" separate. 
            // Ideally backend supports CreateRoom(..., gameType: 'None') or similar.
            // Backend `CreateRoom` sig: `string gameType = "Scatterbrain"`.
            // Let's rely on HostSettings to change it later if they want.

            const typeToUse = gameType || 'Scatterbrain';
            const code = await this.signalRService.createRoom(name, true, typeToUse);

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
