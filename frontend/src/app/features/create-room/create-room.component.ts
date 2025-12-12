import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';

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

    constructor(
        private readonly signalRService: SignalRService,
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) { }

    ngOnInit() {
        // Pre-fill name if logged in
        this.authService.currentUser$.subscribe(user => {
            if (user) this.nickname = user.displayName;
        });

        // Check query params for pre-selected game
        this.route.queryParams.subscribe(params => {
            if (params['gameType']) {
                this.selectedGameType = params['gameType'];
            }
            if (params['name']) {
                this.nickname = params['name'];
            }
        });

        // If still no name, try local storage or just wait for input
    }

    async createRoom() {
        if (!this.nickname) return;

        this.creating = true;
        try {
            if (this.signalRService.connectionStatus$.value !== 'Connected') {
                await this.signalRService.startConnection();
            }

            const code = await this.signalRService.createRoom(
                this.nickname,
                this.isPublic,
                this.selectedGameType
            );

            // Navigate to game room
            this.router.navigate(['/game', code], { queryParams: { name: this.nickname } });
        } catch (e) {
            console.error('Error creating room', e);
            alert('Failed to create room. Please try again.');
            this.creating = false;
        }
    }

    cancel() {
        this.router.navigate(['/games']);
    }
}
