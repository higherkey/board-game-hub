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
    private adminService = inject(AdminService);
    stats: ServerStats | null = null;
    loading = true;
    refreshInterval: any;

    async ngOnInit() {
        try {
            await this.adminService.startConnection();
            await this.loadStats();

            // Auto-refresh every 5 seconds
            this.refreshInterval = setInterval(() => this.loadStats(), 5000);
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

    formatUptime(spanString: string): string {
        // Backend returns TimeSpan string "d.hh:mm:ss" usually
        // Or we can parse it. For now let's just show it or pretty print if needed.
        // The default serialization might be "12:30:45.1234".
        if (!spanString) return '0s';
        return spanString.split('.')[0]; // Remove milliseconds
    }
}
