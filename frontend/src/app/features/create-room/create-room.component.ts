import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { GameDataService, GameDefinition } from '../../services/game-data.service';

@Component({
    selector: 'app-create-room',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './create-room.component.html'
})
export class CreateRoomComponent implements OnInit {
    nickname = '';
    selectedGameType = 'None';
    isPublic = true;
    creating = false;
    games: GameDefinition[] = [];

    // Autocomplete properties
    searchTerm = '';
    filteredGames: GameDefinition[] = [];
    showDropdown = false;
    focusIndex = -1;

    constructor(
        private readonly signalRService: SignalRService,
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly toastService: ToastService,
        private readonly gameDataService: GameDataService
    ) { }

    ngOnInit() {
        // Load games from service
        this.gameDataService.loadGames().subscribe(games => {
            this.games = games.filter(g => g.status === 'Deployed');
            this.filteredGames = [...this.games];

            // Check query params for pre-selected game after games are loaded
            this.route.queryParams.subscribe(params => {
                if (params['gameType']) {
                    const gameId = params['gameType'];
                    const game = this.games.find(g =>
                        g.id.toLowerCase() === gameId.toLowerCase() ||
                        g.name.toLowerCase() === gameId.toLowerCase()
                    );
                    if (game) {
                        this.selectGame(game);
                    }
                }
                if (params['name']) {
                    this.nickname = params['name'];
                }
            });
        });

        // Pre-fill name if logged in
        this.authService.currentUser$.subscribe(user => {
            if (user) this.nickname = user.displayName;
        });
    }

    formatGameName(game: GameDefinition | null): string {
        if (!game) return 'Decide Later (Lobby)';
        // Insert spaces before capitals if they are missing (e.g. BreakingNews -> Breaking News)
        // Only if it doesn't already have a space
        const name = game.name;
        if (name.includes(' ')) return name;
        return name.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    filterGames() {
        this.showDropdown = true;
        this.focusIndex = -1;
        if (!this.searchTerm) {
            this.filteredGames = [...this.games];
            this.selectedGameType = 'None';
            return;
        }

        const term = this.searchTerm.toLowerCase();
        this.filteredGames = this.games.filter(g =>
            g.name.toLowerCase().includes(term) ||
            g.id.toLowerCase().includes(term)
        );
    }

    handleKeyDown(event: KeyboardEvent) {
        if (!this.showDropdown) return;

        if (event.key === 'ArrowDown') {
            this.focusIndex = Math.min(this.focusIndex + 1, this.filteredGames.length - 1);
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            this.focusIndex = Math.max(this.focusIndex - 1, -1);
            event.preventDefault();
        } else if (event.key === 'Enter') {
            if (this.focusIndex >= 0) {
                this.selectGame(this.filteredGames[this.focusIndex]);
            } else if (this.filteredGames.length === 1) {
                this.selectGame(this.filteredGames[0]);
            }
            event.preventDefault();
        } else if (event.key === 'Escape') {
            this.showDropdown = false;
        }
    }

    selectGame(game: GameDefinition | null) {
        if (game) {
            this.selectedGameType = game.id;
            this.searchTerm = this.formatGameName(game);
        } else {
            this.selectedGameType = 'None';
            this.searchTerm = 'Decide Later (Lobby)';
        }
        this.showDropdown = false;
        this.focusIndex = -1;
    }

    onBlur() {
        // Delay closing so click on dropdown item can register
        setTimeout(() => this.showDropdown = false, 200);
    }

    async createRoom() {
        if (!this.nickname) return;

        this.creating = true;
        try {
            if (this.signalRService.connectionStatus$.value !== 'Connected') {
                await this.signalRService.startConnection();
            }

            // Ensure name is saved for guest
            if (!this.authService.currentUserValue) {
                this.authService.setGuestName(this.nickname);
            }

            const code = await this.signalRService.createRoom(
                this.nickname,
                this.isPublic,
                this.selectedGameType
            );

            // Navigate to game room
            this.router.navigate(['/game', code]);
        } catch (e) {
            console.error('Error creating room', e);
            this.toastService.showError('Failed to create room. Please try again.');
            this.creating = false;
        }
    }

    cancel() {
        this.router.navigate(['/games']);
    }
}
