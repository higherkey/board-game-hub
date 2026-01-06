import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, RoomStats, RoomSummary } from '../../services/admin.service';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { interval, Observable, Subscription, tap } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { GameSettings } from '../../services/signalr.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    stats$: Observable<RoomStats | null>;
    connectionStatus$: Observable<string>;

    // Modal States
    showCreateModal = false;
    showMessageModal = false;
    showSettingsModal = false;
    showEditGameModal = false;

    // Tab State
    activeTab: 'rooms' | 'games' = 'rooms';

    // Game Management
    games: GameDefinition[] = [];
    selectedGame: GameDefinition | null = null;
    roomGameDef: GameDefinition | null = null; // For settings modal

    // Form Data
    createHostName = 'AdminBot';
    createGameType = 'Scatterbrain';

    globalMessageContent = '';

    settingsRoomCode = '';
    settings: GameSettings = { timerDurationSeconds: 60, letterMode: 0 };

    // UI State
    expandedRows = new Set<string>();

    private refreshSub?: Subscription;

    constructor(
        private readonly adminService: AdminService,
        private readonly gameDataService: GameDataService
    ) {
        this.stats$ = this.adminService.stats$.pipe(
            tap((stats: RoomStats | null) => stats && console.log('Admin Dashboard stats updated:', stats))
        );
        this.connectionStatus$ = this.adminService.connectionStatus$;
    }

    ngOnInit(): void {
        this.adminService.startConnection();
        this.loadGames();

        // Initial load + Polling fallback (every 30 seconds)
        this.refreshSub = interval(30000).pipe(
            startWith(0)
        ).subscribe(() => this.refreshData());
    }

    ngOnDestroy(): void {
        this.adminService.stopConnection();
        this.refreshSub?.unsubscribe();
    }

    refreshData() {
        this.adminService.refreshStats();
        this.loadGames();
    }

    toggleDetails(code: string) {
        if (this.expandedRows.has(code)) {
            this.expandedRows.delete(code);
        } else {
            this.expandedRows.add(code);
        }
    }

    // --- Modal Triggers ---

    openCreateModal() {
        this.showCreateModal = true;
    }

    openMessageModal() {
        this.showMessageModal = true;
    }

    openSettings(room: RoomSummary) {
        this.settingsRoomCode = room.code;
        this.settings = { ...(room.settings || { timerDurationSeconds: 60 }) };

        // Find matching game definition for metadata
        if (this.games.length === 0) {
            this.loadGames(); // Ensure games are loaded
        }
        this.roomGameDef = this.games.find(g => g.id === room.gameType) || null;

        this.showSettingsModal = true;
    }

    // --- Actions ---

    submitCreateRoom() {
        if (!this.createHostName) return;
        this.adminService.createRoom(this.createHostName, this.createGameType).subscribe({
            next: () => {
                this.showCreateModal = false;
                this.refreshData();
            },
            error: (err: any) => alert(err.message)
        });
    }

    submitGlobalMessage() {
        if (!this.globalMessageContent) return;
        this.adminService.sendGlobalMessage(this.globalMessageContent).subscribe({
            next: () => {
                this.showMessageModal = false;
                this.globalMessageContent = '';
            },
            error: (err: any) => alert(err.message)
        });
    }

    submitSettings() {
        if (!this.settingsRoomCode) return;
        this.adminService.updateSettings(this.settingsRoomCode, this.settings).subscribe({
            next: () => {
                this.showSettingsModal = false;
                this.refreshData();
            },
            error: (err: any) => alert(err.message)
        });
    }

    startGame(code: string) {
        if (!confirm(`Start game for room ${code}?`)) return;
        this.adminService.startGame(code).subscribe({
            next: () => this.refreshData(),
            error: (err: any) => alert(err.message)
        });
    }

    terminateRoom(code: string) {
        if (!confirm(`Are you sure you want to terminate room ${code}?`)) return;
        this.adminService.terminateRoom(code).subscribe({
            next: () => this.refreshData(),
            error: (err: any) => alert(err.message)
        });
    }

    // --- Game Management ---

    setTab(tab: 'rooms' | 'games') {
        this.activeTab = tab;
        if (tab === 'games') {
            this.loadGames();
        }
    }

    loadGames() {
        this.adminService.getGames().subscribe(games => {
            games.forEach(g => {
                if (g.settingsMetadataJson) {
                    try {
                        g.parsedMetadata = JSON.parse(g.settingsMetadataJson);
                    } catch (e) {
                        console.error('Failed to parse metadata for ' + g.id, e);
                    }
                }
            });
            this.games = games;
        });
    }

    openEditGame(game: GameDefinition) {
        this.selectedGame = { ...game }; // Clone for editing
        this.showEditGameModal = true;
    }

    submitEditGame() {
        if (!this.selectedGame) return;
        this.adminService.updateGame(this.selectedGame.id, this.selectedGame).subscribe({
            next: () => {
                this.showEditGameModal = false;
                this.loadGames();
                // Also refresh main games cache if needed, though redirecting or refreshing usually handles it
            },
            error: (err: any) => alert(err.message)
        });
    }
}
