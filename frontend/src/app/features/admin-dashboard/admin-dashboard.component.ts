import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, ServerStats } from '../../services/admin.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    private readonly adminService = inject(AdminService);
    stats: ServerStats | null = null;
    loading = true;
    refreshInterval: any;

    expandedRooms = new Set<string>();

    ngOnInit() {
        this.initDashboard();
    }

    private async initDashboard() {
        try {
            await this.adminService.startConnection();
            await this.loadStats();

            // Auto-refresh every second
            this.refreshInterval = setInterval(() => this.loadStats(), 1000);
        } catch (err) {
            console.error('Failed to connect to Admin Hub', err);
            this.loading = false;
        }
    }

    ngOnDestroy() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.adminService.stopConnection();
    }

    async loadStats() {
        try {
            this.stats = await this.adminService.getStats();
        } catch (err) {
            console.error('Error loading stats', err);
        } finally {
            this.loading = false;
        }
    }

    toggleRoom(code: string) {
        if (this.expandedRooms.has(code)) {
            this.expandedRooms.delete(code);
        } else {
            this.expandedRooms.add(code);
        }
    }

    isExpanded(code: string): boolean {
        return this.expandedRooms.has(code);
    }

    formatUptime(spanString: string): string {
        // Backend returns TimeSpan string "d.hh:mm:ss" usually
        if (!spanString) return '0s';
        return spanString.split('.')[0];
    }

    trackByRoom(index: number, room: any): string {
        return room.code;
    }

    async kickPlayer(roomCode: string, connectionId: string) {
        if (!confirm('Are you sure you want to kick this player?')) return;
        try {
            // Need to expose this in service first, but we can call invoke directly for now or add to service
            // Creating a quick service method is cleaner.
            await this.adminService.kickPlayer(roomCode, connectionId);
            await this.loadStats(); // Refresh immediately
        } catch (err) {
            console.error('Failed to kick player', err);
        }
    }

    async promoteToHost(roomCode: string, connectionId: string) {
        try {
            await this.adminService.promoteToHost(roomCode, connectionId);
            await this.loadStats();
        } catch (err) {
            console.error('Failed to promote player', err);
        }
    }
}
