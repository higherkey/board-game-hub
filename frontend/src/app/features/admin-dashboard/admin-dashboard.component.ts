import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, RoomStats, RoomSummary } from '../../services/admin.service';
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    stats$: Observable<RoomStats | null>;

    // Modal States
    showCreateModal = false;
    showMessageModal = false;
    showSettingsModal = false;

    // Form Data
    createHostName = 'AdminBot';
    createGameType = 'Scatterbrain';

    globalMessageContent = '';

    settingsRoomCode = '';
    settingsDuration = 60;

    // UI State
    expandedRows = new Set<string>();

    private refreshSub?: Subscription;

    constructor(private readonly adminService: AdminService) {
        this.stats$ = this.adminService.stats$;
    }

    ngOnInit(): void {
        this.adminService.startConnection();
    }

    ngOnDestroy(): void {
        this.adminService.stopConnection();
    }

    refreshData() {
        this.adminService.getStats().subscribe(); // Service updates the subject
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
        this.settingsDuration = room.settingsTimer;
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
            error: (err) => alert(err.message)
        });
    }

    submitGlobalMessage() {
        if (!this.globalMessageContent) return;
        this.adminService.sendGlobalMessage(this.globalMessageContent).subscribe({
            next: () => {
                this.showMessageModal = false;
                this.globalMessageContent = '';
            },
            error: (err) => alert(err.message)
        });
    }

    submitSettings() {
        if (!this.settingsRoomCode) return;
        this.adminService.updateSettings(this.settingsRoomCode, this.settingsDuration).subscribe({
            next: () => {
                this.showSettingsModal = false;
                this.refreshData();
            },
            error: (err) => alert(err.message)
        });
    }

    startGame(code: string) {
        if (!confirm(`Start game for room ${code}?`)) return;
        this.adminService.startGame(code).subscribe({
            next: () => this.refreshData(),
            error: (err) => alert(err.message)
        });
    }

    terminateRoom(code: string) {
        if (!confirm(`Are you sure you want to terminate room ${code}?`)) return;
        this.adminService.terminateRoom(code).subscribe({
            next: () => this.refreshData(),
            error: (err) => alert(err.message)
        });
    }
}
