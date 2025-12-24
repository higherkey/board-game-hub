import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
    selector: 'app-games',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
    templateUrl: './games.component.html',
    styleUrls: ['./games.component.scss']
})
export class GamesComponent implements OnInit {
    games: GameDefinition[] = [];

    constructor(
        private readonly gameDataService: GameDataService,
    ) { }

    ngOnInit() {
        this.gameDataService.loadGames().subscribe(games => {
            this.games = [...games].sort((a, b) => {
                // Sort by status: Deployed (0) first, checking for string 'Deployed'
                if (a.status === 'Deployed' && b.status !== 'Deployed') return -1;
                if (a.status !== 'Deployed' && b.status === 'Deployed') return 1;
                return 0;
            });
        });
    }
}
