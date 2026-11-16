import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GameDataService, GameDefinition, TimerType } from './game-data.service';
import { BUNDLED_GAME_CATALOGUE } from '../data/game-catalogue.generated';
import { environment } from '../../environments/environment';

describe('GameDataService', () => {
    let http: HttpTestingController;
    const key = 'bgh_games_cache';
    const url = `${environment.apiUrl}/games`;
    const freshTime = Date.parse('2099-01-01T00:00:00Z');
    const game = (overrides: Record<string, unknown> = {}) => ({
        id: 'test-game', name: 'Test Game', icon: '', description: '', status: 'Deployed',
        minPlayers: 1, maxPlayers: 4, complexity: 1, averagePlayTime: 10, tags: '',
        timerType: TimerType.Optional, defaultRoundLengthSeconds: 60,
        settingsMetadataJson: '[{"id":"rounds","label":"Rounds","type":"number"}]', ...overrides
    });
    const cache = (overrides: Record<string, unknown> = {}) => ({
        schemaVersion: 1, environment: environment.apiUrl, version: 'test-version',
        generatedAt: BUNDLED_GAME_CATALOGUE.generatedAt, fetchedAt: freshTime,
        games: [game()], ...overrides
    });
    const create = () => TestBed.inject(GameDataService);
    const current = (service: GameDataService) => {
        let value: GameDefinition[] | null = null;
        const subscription = service.games$.subscribe(games => value = games);
        subscription.unsubscribe();
        return value!;
    };
    beforeEach(() => {
        localStorage.clear();
        spyOn(Date, 'now').and.returnValue(freshTime);
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
        http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => { http.verify(); localStorage.clear(); });

    it('synchronously supplies bundled games on first visit without HTTP', () => {
        const games = current(create());
        expect(games.length).toBe(BUNDLED_GAME_CATALOGUE.games.length);
        expect(games.length).toBeGreaterThan(0);
        expect(games[0].id).toBe(BUNDLED_GAME_CATALOGUE.games[0].id);
        http.expectNone(url);
    });
    it('prefers a newer current-tier cache and reconstructs metadata', () => {
        localStorage.setItem(key, JSON.stringify(cache({games: [game({ parsedMetadata: [{ injected: true }] })]})));
        expect(current(create())[0].parsedMetadata).toEqual([{ id: 'rounds', label: 'Rounds', type: 'number' }]);
        expect(current(create())[0].id).toBe('test-game');
    });
    for (const [name, payload] of [
        ['older', () => cache({ fetchedAt: Date.parse(BUNDLED_GAME_CATALOGUE.generatedAt) - 1 })],
        ['equal timestamp', () => cache({ fetchedAt: Date.parse(BUNDLED_GAME_CATALOGUE.generatedAt) })],
        ['wrong-tier', () => cache({ environment: 'https://another-tier.example/api' })],
        ['legacy array', () => [game()]], ['schema', () => cache({ schemaVersion: 2 })],
        ['missing version', () => cache({ version: '' })], ['invalid generatedAt', () => cache({ generatedAt: 'bad' })],
        ['non-ISO generatedAt', () => cache({ generatedAt: '1' })],
        ['generation after fetch', () => cache({ generatedAt: '2100-01-01T00:00:00Z' })],
        ['invalid timestamp', () => cache({ fetchedAt: 'yesterday' })],
        ['future timestamp', () => cache({ fetchedAt: freshTime + 1 })],
        ['invalid game', () => cache({ games: [game({ minPlayers: -1 })] })],
        ['empty', () => cache({ games: [] })]
    ] as const) {
        it(`falls back to bundle for ${name} cache`, () => {
            localStorage.setItem(key, JSON.stringify(payload()));
            expect(current(create())[0].id).toBe(BUNDLED_GAME_CATALOGUE.games[0].id);
        });
    }
    it('survives corrupt storage and read failure', () => {
        localStorage.setItem(key, '{broken');
        expect(current(create()).length).toBeGreaterThan(0);
        TestBed.resetTestingModule();
        spyOn(Storage.prototype, 'getItem').and.throwError('denied');
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
        expect(current(create()).length).toBeGreaterThan(0);
    });
    it('normalizes API timers, safely parses metadata, and persists scoped envelope', () => {
        const service = create();
        service.refreshGames();
        http.expectOne(url).flush([game({ timerType: 'Required' }), game({ id: 'second', timerType: '1', settingsMetadataJson: '{broken', parsedMetadata: ['injected'] }), game({ id: 'third', settingsMetadataJson: '{}' })]);
        expect(current(service).map(g => g.timerType)).toEqual([TimerType.Required, TimerType.Optional, TimerType.Optional]);
        expect(current(service)[0].parsedMetadata).toEqual([{ id: 'rounds', label: 'Rounds', type: 'number' }]);
        expect(current(service)[1].parsedMetadata).toEqual([]);
        expect(current(service)[2].parsedMetadata).toEqual([]);
        const saved = JSON.parse(localStorage.getItem(key)!);
        expect(saved.environment).toBe(environment.apiUrl);
        expect(saved.schemaVersion).toBe(1);
        expect(saved.fetchedAt).toBe(freshTime);
        expect(saved.games[0].parsedMetadata).toBeUndefined();
    });
    for (const payload of [[], null, {}, [game({ timerType: 'unknown' })], [game({ maxPlayers: 0 })], [game({ id: '' })], [game(), game()],
        [game({ averagePlayTime: 0 })], [game({ timerType: 'Required', defaultRoundLengthSeconds: 0 })]]) {
        it(`preserves data and permits retry after invalid API response ${JSON.stringify(payload)}`, () => {
            const service = create();
            const before = current(service);
            service.refreshGames(); http.expectOne(url).flush(payload);
            expect(current(service)).toBe(before);
            service.refreshGames(); http.expectOne(url).flush([game()]);
            expect(current(service)[0].id).toBe('test-game');
        });
    }
    it('keeps displayed data on network failure and permits retry', () => {
        const service = create();
        service.refreshGames(); http.expectOne(url).flush([game()]);
        (Date.now as jasmine.Spy).and.returnValue(freshTime + 60001);
        const before = current(service);
        service.refreshGames(); http.expectOne(url).error(new ProgressEvent('error'));
        expect(current(service)).toBe(before);
        service.refreshGames(); http.expectOne(url).flush([game({ name: 'Recovered' })]);
        expect(current(service)[0].name).toBe('Recovered');
    });
    it('bounds requests, preserves data on timeout, and permits retry', fakeAsync(() => {
        const service = create(); const before = current(service);
        service.refreshGames(); const request = http.expectOne(url);
        tick(15000);
        expect(request.cancelled).toBeTrue(); expect(current(service)).toBe(before);
        service.refreshGames(); http.expectOne(url).flush([game()]);
    }));
    it('deduplicates refreshes and suppresses successes for 60 seconds', () => {
        const service = create();
        service.refreshGames(); service.refreshGames();
        http.expectOne(url).flush([game()]);
        expect(current(service)[0].id).toBe('test-game');
        service.refreshGames(); http.expectNone(url);
        (Date.now as jasmine.Spy).and.returnValue(freshTime + 60000);
        service.refreshGames(); http.expectOne(url).flush([game()]);
    });
    it('pings health once across warmups and shares the refresh', fakeAsync(() => {
        const service = create(); service.warmup(); service.warmup();
        const health = http.expectOne(`${environment.apiUrl.replace(/\/api\/?$/, '')}/health`);
        http.expectOne(url).flush([game()]); tick(15000);
        expect(health.cancelled).toBeTrue();
        service.warmup(); http.expectNone(url);
        http.expectNone(`${environment.apiUrl.replace(/\/api\/?$/, '')}/health`);
    }));
    it('retains successful data when storage writes fail', () => {
        spyOn(Storage.prototype, 'setItem').and.throwError('quota');
        const service = create(); service.refreshGames(); http.expectOne(url).flush([game()]);
        expect(current(service)[0].id).toBe('test-game');
    });
    it('does not emit duplicate data but advances cache freshness after a successful refresh', () => {
        const service = create();
        const emitted: (GameDefinition[] | null)[] = [];
        const subscription = service.games$.subscribe(games => emitted.push(games));
        service.refreshGames(); http.expectOne(url).flush([game()]);
        (Date.now as jasmine.Spy).and.returnValue(freshTime + 60000);
        service.refreshGames(); http.expectOne(url).flush([game()]);
        expect(emitted.length).toBe(2);
        expect(JSON.parse(localStorage.getItem(key)!).fetchedAt).toBe(freshTime + 60000);
        subscription.unsubscribe();
    });
    it('ignores oversized storage before parsing', () => {
        localStorage.setItem(key, ' '.repeat(2_000_001));
        expect(current(create())[0].id).toBe(BUNDLED_GAME_CATALOGUE.games[0].id);
    });
    it('accepts null optional metadata and whitelists public API fields', () => {
        const service = create(); service.refreshGames();
        http.expectOne(url).flush([game({ settingsMetadataJson: null, privateData: 'do not cache' })]);
        expect(current(service)[0].parsedMetadata).toEqual([]);
        expect(localStorage.getItem(key)).not.toContain('privateData');
        expect(localStorage.getItem(key)).not.toContain('do not cache');
    });
    it('allows catalogue retry after failed health and catalogue requests without another health ping', () => {
        const service = create(); service.warmup();
        const healthUrl = `${environment.apiUrl.replace(/\/api\/?$/, '')}/health`;
        http.expectOne(healthUrl).error(new ProgressEvent('error'));
        http.expectOne(url).error(new ProgressEvent('error'));
        service.warmup(); http.expectNone(healthUrl);
        http.expectOne(url).flush([game()]);
        expect(current(service)[0].id).toBe('test-game');
    });
    it('returns status labels', () => {
        expect([0, 1, 2, 3, 99].map(value => create().getStatusLabel(value)))
            .toEqual(['Deployed', 'Testing', 'InDevelopment', 'Backlog', 'Unknown']);
    });
    it('drops unsafe metadata entries and persists only normalized settings', () => {
        const valid = { id: 'rounds', label: 'Rounds', type: 'number', default: 3 };
        const malformed = [
            null, [], { id: 'size', label: 'Size', type: 'select', options: {} },
            { id: 'size', label: 'Size', type: 'select', options: [null] },
            { id: 'size', label: 'Size', type: 'select', options: [] },
            { id: 'size', label: 'Size', type: 'select', options: [{ label: 'Bad', value: {} }] },
            { id: 'size', label: 'Size', type: 'select', options: [{ label: 1, value: 1 }] },
            ...['__proto__', 'constructor', 'prototype', '', 'unsafe.name'].map(id => ({ id, label: 'Unsafe', type: 'number' })),
            { id: 'bad', label: null, type: 'number' }, { id: 'bad', label: 'Bad', type: 'custom' },
            { id: 'bad', label: 'Bad', type: 'checkbox', default: 'yes' },
            { id: 'bad', label: 'Bad', type: 'checkbox', defaultValue: 1 },
            { id: 'bad', label: 'Bad', type: 'number', default: '3' },
            { id: 'bad', label: 'Bad', type: 'number', defaultValue: null }
        ];
        const service = create(); service.refreshGames();
        http.expectOne(url).flush([game({ settingsMetadataJson: JSON.stringify([...malformed, { ...valid, privateField: 'omit' }]) })]);
        expect(current(service)[0].parsedMetadata).toEqual([valid]);
        const persisted = JSON.parse(localStorage.getItem(key)!).games[0];
        expect(JSON.parse(persisted.settingsMetadataJson)).toEqual([valid]);
        expect(persisted.settingsMetadataJson).not.toContain('privateField');
    });
    it('preserves supported defaults and clones only supported select option fields', () => {
        const metadata = [
            { id: 'mode', label: 'Mode', type: 'select', options: [{ label: 'Numeric', value: 1 }, { label: 'Text', value: 'text' }, { label: 'Toggle', value: false }] },
            { id: 'enabled', label: 'Enabled', type: 'checkbox', default: true, defaultValue: false },
            { id: 'rounds', label: 'Rounds', type: 'number', default: 2, defaultValue: 4 }
        ];
        const service = create(); service.refreshGames();
        const input = JSON.parse(JSON.stringify(metadata)); input[0].options[0].unexpected = 'omit';
        http.expectOne(url).flush([game({ settingsMetadataJson: JSON.stringify(input) })]);
        expect(current(service)[0].parsedMetadata).toEqual(metadata);
        expect(JSON.parse(current(service)[0].settingsMetadataJson!)).toEqual(metadata);
    });
    it('preserves bundled Babble/Scatterbrain choices and CloverMinded checkbox default', () => {
        const games = current(create());
        for (const id of ['Babble', 'Scatterbrain']) {
            expect(games.find(game => game.id === id)!.parsedMetadata![0].options.length).toBeGreaterThan(0);
        }
        expect(games.find(game => game.id === 'CloverMinded')!.parsedMetadata![0].default).toBeTrue();
    });
});
