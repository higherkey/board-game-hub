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
    filteredGames: GameDefinition[] = [];

    // Filter State
    searchQuery: string = '';
    selectedTag: string = '';
    playerCount: number | null = null;
    sortBy: 'name' | 'complexity' | 'time' | 'status' = 'status';

    allTags: string[] = [];

    constructor(
        private readonly gameDataService: GameDataService,
    ) { }

    ngOnInit() {
        this.gameDataService.loadGames().subscribe(games => {
            this.games = games;
            this.extractTags();
            this.applyFilters();
        });
    }

    extractTags() {
        const tagsSet = new Set<string>();
        this.games.forEach(g => {
            g.tags?.split(',').forEach(t => tagsSet.add(t.trim()));
        });
        this.allTags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
    }

    applyFilters() {
        let result = [...this.games];

        // Search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(g =>
                g.name.toLowerCase().includes(query) ||
                g.description.toLowerCase().includes(query)
            );
        }

        // Tag Filter
        if (this.selectedTag) {
            result = result.filter(g => g.tags?.split(',').map(t => t.trim()).includes(this.selectedTag));
        }

        // Player Count Filter
        if (this.playerCount) {
            result = result.filter(g => g.minPlayers <= this.playerCount! && g.maxPlayers >= this.playerCount!);
        }

        // Sort
        result.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'complexity':
                    return (b.complexity || 0) - (a.complexity || 0); // High to Low
                case 'time':
                    return (a.averagePlayTime || 0) - (b.averagePlayTime || 0); // Short to Long
                case 'status':
                default: {
                    // Deployed/Testing first
                    const isPlayable = (s: string) => s === 'Deployed' || s === 'Testing';
                    if (isPlayable(a.status) && !isPlayable(b.status)) return -1;
                    if (!isPlayable(a.status) && isPlayable(b.status)) return 1;
                    return a.name.localeCompare(b.name);
                }
            }
        });

        this.filteredGames = result;
    }

    setSort(sort: 'name' | 'complexity' | 'time' | 'status') {
        this.sortBy = sort;
        this.applyFilters();
    }

    setTag(tag: string) {
        this.selectedTag = this.selectedTag === tag ? '' : tag;
        this.applyFilters();
    }
}
