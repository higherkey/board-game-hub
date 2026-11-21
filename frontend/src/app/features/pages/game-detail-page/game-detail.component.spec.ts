import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { GameDetailComponent } from './game-detail.component';
import { gameTitleResolver } from './game-title.resolver';
import { GameDataService } from '../../../services/game-data.service';
import { gameSlug } from '../../../shared/game-slug';

const game = (id: string, name: string, status: string, min: number, max: number, minutes: number, tags: string, complexity = 1) =>
    ({ id, name, status, minPlayers: min, maxPlayers: max, averagePlayTime: minutes, tags, complexity, description: name + ' description', icon: '' });

describe('GameDetailComponent', () => {
    let harness: RouterTestingHarness;
    const games$ = new BehaviorSubject<any[] | null>([
        game('Farkle', 'Farkle', 'Testing', 1, 8, 20, 'Dice,Party,Luck'),
        game('Yacht', 'Yacht', 'Testing', 1, 8, 30, 'Dice,Strategy,Classic', 2),
        game('Warships', 'Warships', 'InDevelopment', 2, 2, 15, 'Strategy,Combat', 4),
        game('CloverMinded', 'Clover-Minded', 'Testing', 3, 6, 25, 'Cooperative,Word,Party', 3),
        game('Terminal', 'Terminal', 'Backlog', 2, 5, 20, 'Cooperative')
    ]);

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'shelf/:slug', component: GameDetailComponent, title: gameTitleResolver },
                    { path: 'games/:gameId', redirectTo: ({ params }) => `/shelf/${gameSlug(params['gameId'])}` }
                ]),
                { provide: GameDataService, useValue: { games$, refreshGames: jasmine.createSpy('refreshGames') } }
            ]
        });
        harness = await RouterTestingHarness.create();
    });

    const text = (selector: string) => harness.routeNativeElement?.querySelector(selector)?.textContent?.trim();
    const all = (selector: string) => [...(harness.routeNativeElement?.querySelectorAll(selector) ?? [])].map(e => e.textContent?.trim());

    it('shows a playable game with its guide, scoring and a host action', async () => {
        await harness.navigateByUrl('/shelf/farkle');
        expect(text('h1')).toBe('Farkle');
        expect(text('.gd-status')).toBe('Playable now');
        expect(all('.gd-fact dd')).toEqual(['1 to 8', '20 min', 'Easy']);
        expect(all('.gd-step h3')).toEqual(['Roll', 'Keep scoring dice', 'Bank or push']);
        expect(all('.gd-table th').length).toBe(11);
        expect(text('.gd-host')).toBe('Host Farkle');
        expect(TestBed.inject(Title).getTitle()).toContain('Farkle');
    });

    it('lists similar games, playable first, and leaves backlog games out', async () => {
        await harness.navigateByUrl('/shelf/farkle');
        expect(all('.gd-similar .gb-title')).toEqual(['Clover-Minded', 'Yacht']);
    });

    it('falls back to the game-night steps for a game without its own guide', async () => {
        await harness.navigateByUrl('/shelf/warships');
        expect(text('.gd-status')).toBe('Coming soon');
        expect(text('#gd-steps')).toBe('How a game night works');
        expect(harness.routeNativeElement?.querySelector('.gd-table')).toBeNull();
        expect(text('.gd-host')).toBe('Try it early');
        expect(all('.gd-fact dd')).toEqual(['2', '15 min', 'Deep']);
    });

    it('redirects old /games/:id links to the readable address', async () => {
        await harness.navigateByUrl('/games/CloverMinded');
        expect(TestBed.inject(Router).url).toBe('/shelf/clover-minded');
        expect(text('h1')).toBe('Clover-Minded');
        expect(text('.gd-fact dd')).toBe('3 to 6');
    });

    it('says so when no game has the address', async () => {
        await harness.navigateByUrl('/shelf/not-a-game');
        expect(text('h1')).toBe('That game is not on the shelf');
        expect(TestBed.inject(Title).getTitle()).toContain('Game not found');
    });
});
