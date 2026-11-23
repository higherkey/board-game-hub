import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { GameBoxComponent, playerRange } from '../../../shared/components/game-box/game-box.component';
import { findGameBySlug, gameSlug } from '../../../shared/game-slug';
import { GAME_GUIDES, GENERIC_GUIDE } from './game-guides';

const SHELF_STATUSES = new Set(['Deployed', 'Testing', 'InDevelopment']);
const isPlayable = (g: GameDefinition) => g.status === 'Deployed' || g.status === 'Testing';

/** One game's page at /shelf/:slug: its box, how it plays, scoring, and similar games. */
@Component({
    selector: 'app-game-detail',
    standalone: true,
    imports: [RouterModule, GameBoxComponent],
    templateUrl: './game-detail.component.html',
    styleUrls: ['./game-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameDetailComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly gameDataService = inject(GameDataService);

    protected readonly slug = gameSlug;

    private readonly games = toSignal(this.gameDataService.games$, { initialValue: null });
    private readonly param = toSignal(this.route.paramMap.pipe(map(p => p.get('slug') ?? '')), { initialValue: '' });

    /** undefined while the catalogue loads; null when no game has this address. */
    protected readonly game = computed<GameDefinition | null | undefined>(() => {
        const games = this.games();
        if (!games) return undefined;
        return findGameBySlug(games, this.param()) ?? null;
    });

    protected readonly guide = computed(() => {
        const game = this.game();
        return (game && GAME_GUIDES[game.id]) || GENERIC_GUIDE;
    });

    protected readonly playable = computed(() => {
        const game = this.game();
        return !!game && isPlayable(game);
    });

    protected readonly facts = computed(() => {
        const game = this.game();
        if (!game) return [];
        const c = game.complexity || 1;
        return [
            { value: playerRange(game).replace(/ players?$/, ''), label: game.minPlayers === 1 && game.maxPlayers === 1 ? 'player' : 'players' },
            { value: `${game.averagePlayTime} min`, label: 'about' },
            { value: c <= 2 ? 'Easy' : c === 3 ? 'Some' : 'Deep', label: c <= 2 ? 'to learn' : 'strategy' }
        ];
    });

    protected readonly tags = computed(() => (this.game()?.tags ?? '').split(',').map(t => t.trim()).filter(Boolean));

    /** Up to four other games on the shelf that share a tag, playable ones first. */
    protected readonly similar = computed(() => {
        const game = this.game();
        const games = this.games();
        if (!game || !games) return [];
        const tags = new Set(this.tags());
        return games
            .filter(g => g.id !== game.id && SHELF_STATUSES.has(g.status) && (g.tags ?? '').split(',').some(t => tags.has(t.trim())))
            .sort((a, b) => Number(isPlayable(b)) - Number(isPlayable(a)) || a.name.localeCompare(b.name))
            .slice(0, 4);
    });

    constructor() {
        this.gameDataService.refreshGames();
    }
}
