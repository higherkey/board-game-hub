import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { GameBoxComponent, gameBoxTheme, playerRange } from '../../../shared/components/game-box/game-box.component';
import { gameSlug } from '../../../shared/game-slug';

type Length = 'short' | 'mid' | 'long';
type Sort = 'status' | 'name' | 'time';

interface Playlist {
    id: string;
    title: string;
    theme: number;
    test: (g: GameDefinition) => boolean;
}

const hasTag = (...tags: string[]) => (g: GameDefinition) =>
    (g.tags ?? '').split(',').some(t => tags.includes(t.trim()));

/** Ready-made picks, built from data every game already has. */
const PLAYLISTS: Playlist[] = [
    { id: 'two', title: 'Good with 2', theme: 1, test: g => g.minPlayers <= 2 && g.maxPlayers >= 2 },
    { id: 'big', title: 'Big groups, 6 or more', theme: 2, test: g => g.maxPlayers >= 6 },
    { id: 'dice', title: 'Dice games', theme: 4, test: hasTag('Dice') },
    { id: 'word', title: 'Word games', theme: 7, test: hasTag('Word') },
    { id: 'party', title: 'Party games', theme: 6, test: hasTag('Party') },
    { id: 'drawing', title: 'Drawing games', theme: 3, test: hasTag('Drawing') },
    { id: 'team', title: 'Team games', theme: 5, test: hasTag('Teams', 'Team', 'Cooperative', 'Coop') }
];

const LENGTHS: { id: Length; label: string; test: (min: number) => boolean }[] = [
    { id: 'short', label: 'Under 15 min', test: m => m < 15 },
    { id: 'mid', label: '15 to 30 min', test: m => m >= 15 && m <= 30 },
    { id: 'long', label: 'Longer', test: m => m > 30 }
];

const SHELF_STATUSES = new Set(['Deployed', 'Testing', 'InDevelopment']);
const isPlayable = (g: GameDefinition) => g.status === 'Deployed' || g.status === 'Testing';

@Component({
    selector: 'app-games',
    standalone: true,
    imports: [RouterModule, GameBoxComponent],
    templateUrl: './games.component.html',
    styleUrls: ['./games.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamesComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly gameDataService = inject(GameDataService);

    @ViewChild('searchInput') private readonly searchInput?: ElementRef<HTMLInputElement>;

    protected readonly slug = gameSlug;
    protected readonly counts = [1, 2, 3, 4, 5, 6, 7, 8];
    protected readonly lengths = LENGTHS;

    protected readonly games = signal<GameDefinition[]>([]);
    protected readonly query = signal('');
    protected readonly players = signal<number | null>(null);
    protected readonly length = signal<Length | null>(null);
    protected readonly playlistId = signal<string | null>(null);
    protected readonly sortBy = signal<Sort>('status');
    /** Phones only: the filters panel is folded until asked for. */
    protected readonly filtersOpen = signal(false);
    protected readonly filterCount = computed(() => Number(this.players() !== null) + Number(this.length() !== null));

    /** Everything on the shelf: playable games and the ones coming soon. */
    protected readonly shelf = computed(() => this.games().filter(g => SHELF_STATUSES.has(g.status)));

    protected readonly playlists = computed(() => PLAYLISTS
        .map(p => {
            const games = this.shelf().filter(p.test);
            return { ...p, count: games.length, spines: games.slice(0, 3).map(g => gameBoxTheme(g.id)) };
        })
        .filter(p => p.count > 0));

    protected readonly playlist = computed(() => PLAYLISTS.find(p => p.id === this.playlistId()) ?? null);

    protected readonly filtering = computed(() =>
        !!this.query().trim() || this.players() !== null || this.length() !== null || this.playlist() !== null);

    protected readonly results = computed(() => {
        const q = this.query().trim().toLowerCase();
        const n = this.players();
        const len = LENGTHS.find(l => l.id === this.length());
        const list = this.playlist();
        return this.sorted(this.shelf().filter(g =>
            (!q || [g.name, g.description, g.tags].some(text => (text ?? '').toLowerCase().includes(q))) &&
            (n === null || (n >= 8 ? g.maxPlayers >= 8 : g.minPlayers <= n && g.maxPlayers >= n)) &&
            (!len || len.test(g.averagePlayTime || 0)) &&
            (!list || list.test(g))));
    });

    protected readonly allGames = computed(() => this.sorted(this.shelf()));

    protected readonly resultTitle = computed(() => {
        const count = this.results().length;
        const games = count === 1 ? 'game' : 'games';
        const q = this.query().trim();
        return q ? `${count} ${games} match “${q}”` : `${count} ${games}`;
    });

    /** The filters in force, each with its own remove button. */
    protected readonly activeFilters = computed(() => {
        const chips: { label: string; clear: () => void }[] = [];
        const list = this.playlist();
        if (list) chips.push({ label: list.title, clear: () => this.playlistId.set(null) });
        const n = this.players();
        if (n !== null) chips.push({ label: n >= 8 ? '8 or more players' : `${n} ${n === 1 ? 'player' : 'players'}`, clear: () => this.players.set(null) });
        const len = LENGTHS.find(l => l.id === this.length());
        if (len) chips.push({ label: len.label, clear: () => this.length.set(null) });
        return chips;
    });

    ngOnInit(): void {
        this.gameDataService.games$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(games => {
            if (games) this.games.set(games);
        });
        this.gameDataService.refreshGames();
    }

    /** "/" jumps to search, as the hint in the search field says. */
    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        const typing = !!target?.closest('input, textarea, select, [contenteditable="true"]');
        if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            this.searchInput?.nativeElement.focus();
        }
    }

    protected setQuery(event: Event): void {
        this.query.set((event.target as HTMLInputElement).value);
    }

    protected setSort(event: Event): void {
        this.sortBy.set((event.target as HTMLSelectElement).value as Sort);
    }

    protected togglePlayers(n: number): void {
        this.players.update(current => current === n ? null : n);
    }

    protected toggleLength(id: Length): void {
        this.length.update(current => current === id ? null : id);
    }

    protected clearAll(): void {
        this.query.set('');
        this.players.set(null);
        this.length.set(null);
        this.playlistId.set(null);
    }

    protected fit(g: GameDefinition): string {
        return `${playerRange(g)}, ${g.averagePlayTime} min`;
    }

    protected isPlayable(g: GameDefinition): boolean {
        return isPlayable(g);
    }

    private sorted(list: GameDefinition[]): GameDefinition[] {
        const sort = this.sortBy();
        return [...list].sort((a, b) => {
            if (sort === 'time') return (a.averagePlayTime || 0) - (b.averagePlayTime || 0) || a.name.localeCompare(b.name);
            if (sort === 'status' && isPlayable(a) !== isPlayable(b)) return isPlayable(a) ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    }
}
