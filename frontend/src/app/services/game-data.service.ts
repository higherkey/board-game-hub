import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, finalize, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { BUNDLED_GAME_CATALOGUE } from '../data/game-catalogue.generated';

export interface GameDefinition {
    id: string;
    name: string;
    icon: string;
    description: string;
    status: 'Deployed' | 'Testing' | 'InDevelopment' | 'Backlog';
    minPlayers: number;
    maxPlayers: number;
    complexity: number;
    averagePlayTime: number;
    tags: string;
    // Timer Settings
    timerType: TimerType;
    defaultRoundLengthSeconds: number;

    // Dynamic Settings
    settingsMetadataJson?: string;
    parsedMetadata?: any[]; // Typed helper if needed
}

export enum TimerType {
    NotApplicable = 0,
    Optional = 1,
    Required = 2
}

@Injectable({
    providedIn: 'root'
})
export class GameDataService {
    private static readonly STORAGE_KEY = 'bgh_games_cache';
    private static readonly MAX_CACHE_LENGTH = 2_000_000;
    private readonly apiUrl = environment.apiUrl + '/games';
    private readonly healthUrl = environment.apiUrl.replace(/\/api\/?$/, '') + '/health';

    private refreshInFlight = false;
    private lastSuccessfulRefresh: number | undefined;
    private healthStarted = false;

    // Every subscriber has public catalogue data before any network request.
    private readonly gamesSubject = new BehaviorSubject<GameDefinition[] | null>(this.loadCachedGames());
    public readonly games$ = this.gamesSubject.asObservable();

    constructor(private readonly http: HttpClient) { }

    private loadCachedGames(): GameDefinition[] {
        const bundled = this.normalizeGames(BUNDLED_GAME_CATALOGUE.games) ?? [];
        try {
            const raw = localStorage.getItem(GameDataService.STORAGE_KEY);
            if (!raw || raw.length > GameDataService.MAX_CACHE_LENGTH) return bundled;
            const cached = JSON.parse(raw);
            if (!cached || cached.schemaVersion !== 1 || cached.environment !== environment.apiUrl ||
                typeof cached.version !== 'string' || !cached.version.trim() ||
                typeof cached.generatedAt !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(cached.generatedAt) ||
                !Number.isFinite(Date.parse(cached.generatedAt)) ||
                typeof cached.fetchedAt !== 'number' || !Number.isFinite(cached.fetchedAt) ||
                cached.fetchedAt < Date.parse(cached.generatedAt) ||
                cached.fetchedAt <= Date.parse(BUNDLED_GAME_CATALOGUE.generatedAt) || cached.fetchedAt > Date.now()) {
                return bundled;
            }
            return this.normalizeGames(cached.games) ?? bundled;
        } catch {
            return bundled;
        }
    }

    private normalizeGames(value: unknown): GameDefinition[] | null {
        if (!Array.isArray(value) || value.length === 0 || value.length > 1000) return null;
        const ids = new Set<string>();
        const games: GameDefinition[] = [];
        for (const source of value) {
            if (!source || typeof source !== 'object') return null;
            const strings = ['id', 'name', 'icon', 'description', 'tags'];
            if (strings.some(key => typeof source[key] !== 'string' || source[key].length > 100_000) ||
                !source.id.trim() || !source.name.trim() || ids.has(source.id) ||
                !['Deployed', 'Testing', 'InDevelopment', 'Backlog'].includes(source.status)) return null;
            const numbers = ['minPlayers', 'maxPlayers', 'complexity', 'averagePlayTime', 'defaultRoundLengthSeconds'];
            if (numbers.some(key => !Number.isInteger(source[key]) || source[key] < 0) ||
                source.minPlayers < 1 || source.maxPlayers < source.minPlayers ||
                source.complexity < 1 || source.complexity > 5 || source.averagePlayTime <= 0) return null;
            const timerNames: Record<string, TimerType> = {
                NotApplicable: TimerType.NotApplicable, Optional: TimerType.Optional, Required: TimerType.Required
            };
            const timer = typeof source.timerType === 'string'
                ? Object.prototype.hasOwnProperty.call(timerNames, source.timerType)
                    ? timerNames[source.timerType] : /^[0-2]$/.test(source.timerType) ? Number(source.timerType) : -1
                : source.timerType;
            if (![TimerType.NotApplicable, TimerType.Optional, TimerType.Required].includes(timer)) return null;
            if (timer === TimerType.Required && source.defaultRoundLengthSeconds <= 0) return null;
            if (source.settingsMetadataJson != null && (typeof source.settingsMetadataJson !== 'string' ||
                source.settingsMetadataJson.length > 100_000)) return null;
            const parsedMetadata = this.normalizeMetadata(source.settingsMetadataJson);
            // Whitelist public fields and always reconstruct parsed metadata.
            games.push({
                id: source.id, name: source.name, icon: source.icon, description: source.description,
                status: source.status, minPlayers: source.minPlayers, maxPlayers: source.maxPlayers,
                complexity: source.complexity, averagePlayTime: source.averagePlayTime, tags: source.tags,
                timerType: timer, defaultRoundLengthSeconds: source.defaultRoundLengthSeconds,
                settingsMetadataJson: JSON.stringify(parsedMetadata), parsedMetadata
            });
            ids.add(source.id);
        }
        return games;
    }

    private normalizeMetadata(raw: string | undefined): any[] {
        let parsed: unknown;
        try { parsed = raw ? JSON.parse(raw) : []; } catch { return []; }
        if (!Array.isArray(parsed)) return [];
        const normalized: any[] = [];
        const ids = new Set<string>();
        const scalar = (value: unknown) => typeof value === 'string' || typeof value === 'boolean' ||
            (typeof value === 'number' && Number.isFinite(value));
        for (const item of parsed) {
            if (!item || typeof item !== 'object' || Array.isArray(item) ||
                typeof item.id !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(item.id) ||
                ['__proto__', 'constructor', 'prototype'].includes(item.id) || ids.has(item.id) ||
                typeof item.label !== 'string' || !['select', 'number', 'checkbox'].includes(item.type)) continue;
            const defaults = ['default', 'defaultValue'].filter(key => Object.prototype.hasOwnProperty.call(item, key));
            if (defaults.some(key => item.type === 'checkbox' ? typeof item[key] !== 'boolean' :
                item.type === 'number' ? typeof item[key] !== 'number' || !Number.isFinite(item[key]) : !scalar(item[key]))) continue;
            const entry: any = { id: item.id, label: item.label, type: item.type };
            if (item.type === 'select') {
                if (!Array.isArray(item.options) || item.options.length === 0 ||
                    item.options.some((option: any) => !option || typeof option !== 'object' || Array.isArray(option) ||
                        typeof option.label !== 'string' || !scalar(option.value))) continue;
                entry.options = item.options.map((option: any) => ({ label: option.label, value: option.value }));
            }
            for (const key of defaults) entry[key] = item[key];
            normalized.push(entry);
            ids.add(item.id);
        }
        return normalized;
    }

    private persistGames(games: GameDefinition[], fetchedAt: number): void {
        try {
            const envelope = {
                schemaVersion: 1, environment: environment.apiUrl,
                version: BUNDLED_GAME_CATALOGUE.version, generatedAt: BUNDLED_GAME_CATALOGUE.generatedAt, fetchedAt,
                games: games.map(({ parsedMetadata, ...game }) => game)
            };
            const raw = JSON.stringify(envelope);
            if (raw.length <= GameDataService.MAX_CACHE_LENGTH) localStorage.setItem(GameDataService.STORAGE_KEY, raw);
        } catch { /* Storage is an optional optimization. */ }
    }

    warmup(): void {
        if (!this.healthStarted) {
            this.healthStarted = true;
            this.http.get(this.healthUrl).pipe(timeout(15_000)).subscribe({ error: () => {} });
        }
        this.refreshGames();
    }

    refreshGames(): void {
        if (this.refreshInFlight || (this.lastSuccessfulRefresh !== undefined &&
            Date.now() - this.lastSuccessfulRefresh < 60_000)) return;
        this.refreshInFlight = true;
        this.http.get<unknown>(this.apiUrl).pipe(
            timeout(15_000),
            finalize(() => this.refreshInFlight = false)
        ).subscribe({
            next: response => {
                const games = this.normalizeGames(response);
                if (!games) return;
                const fetchedAt = Date.now();
                this.lastSuccessfulRefresh = fetchedAt;
                if (JSON.stringify(games) !== JSON.stringify(this.gamesSubject.value)) this.gamesSubject.next(games);
                this.persistGames(games, fetchedAt);
            },
            error: () => { /* Keep hydrated data visible and permit retry on the next call. */ }
        });
    }

    // Helper to get Status label if needed
    getStatusLabel(status: number): string {
        switch (status) {
            case 0: return 'Deployed';
            case 1: return 'Testing';
            case 2: return 'InDevelopment';
            case 3: return 'Backlog';
            default: return 'Unknown';
        }
    }
}
