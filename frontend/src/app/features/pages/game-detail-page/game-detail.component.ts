import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { SignalRService } from '../../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './game-detail.component.html',
    styleUrls: ['./game-detail.component.scss']
})
export class GameDetailComponent implements OnInit, OnDestroy {
    gameId: string | null = null;
    game: GameDefinition | undefined;
    isRulesExpanded = false;
    isLoggedIn = false;
    gameHistory: any[] = [];
    isLoadingHistory = true;

    private readonly subs = new Subscription();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly gameDataService: GameDataService,
        private readonly signalRService: SignalRService
    ) { }

    ngOnInit() {
        this.gameId = this.route.snapshot.paramMap.get('gameId');

        // Check login status (using signalRService.me$ or similar if available)
        this.subs.add(
            this.signalRService.me$.subscribe(me => {
                this.isLoggedIn = !!me && !me.name?.includes('Guest'); // Simple check for now
            })
        );

        if (this.gameId) {
            this.subs.add(
                this.gameDataService.games$.subscribe(games => {
                    if (games) {
                        this.game = games.find(g => g.id === this.gameId);
                    }
                })
            );

            // In a real app, we'd fetch stats/history for this specific game
            // For now, let's pretend we're loading and then show empty or placeholders
            setTimeout(() => {
                this.isLoadingHistory = false;
                this.gameHistory = []; // Mock: no history yet
            }, 1000);
        }
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    toggleRules() {
        this.isRulesExpanded = !this.isRulesExpanded;
    }
}
