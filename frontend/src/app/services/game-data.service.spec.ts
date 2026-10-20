import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GameDataService, GameDefinition, TimerType } from './game-data.service';
import { environment } from '../../environments/environment';

describe('GameDataService', () => {
    let service: GameDataService;
    let httpMock: HttpTestingController;

    const mockGames: GameDefinition[] = [
        {
            id: '1', name: 'Game One', icon: '', description: '', status: 'Deployed',
            minPlayers: 1, maxPlayers: 4, complexity: 1, averagePlayTime: 10, tags: '',
            timerType: TimerType.NotApplicable, defaultRoundLengthSeconds: 60,
            settingsMetadataJson: '[{"key":"value"}]'
        }
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameDataService]
        });
        service = TestBed.inject(GameDataService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should refresh games and parse metadata', () => {
        let emittedGames: GameDefinition[] | null = null;
        service.games$.subscribe(games => emittedGames = games);

        service.refreshGames();

        const req = httpMock.expectOne(`${environment.apiUrl}/games`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);

        expect(emittedGames).toBeTruthy();
        expect(emittedGames!.length).toBe(1);
        expect(emittedGames![0].parsedMetadata).toBeDefined();
        expect(emittedGames![0].parsedMetadata![0].key).toBe('value');
    });

    it('should initialize with cached games from localStorage if available', () => {
        localStorage.setItem('bgh_games_cache', JSON.stringify(mockGames));
        const customService = new GameDataService(TestBed.inject(HttpClientTestingModule as any));
        expect(customService).toBeTruthy();
        localStorage.removeItem('bgh_games_cache');
    });

    it('should trigger health ping and refresh on warmup', () => {
        service.warmup();
        const healthReq = httpMock.expectOne(`${environment.apiUrl.replace(/\/api\/?$/, '')}/health`);
        expect(healthReq.request.method).toBe('GET');
        healthReq.flush({ status: 'healthy' });

        const gamesReq = httpMock.expectOne(`${environment.apiUrl}/games`);
        expect(gamesReq.request.method).toBe('GET');
        gamesReq.flush(mockGames);
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel(0)).toBe('Deployed');
        expect(service.getStatusLabel(1)).toBe('Testing');
        expect(service.getStatusLabel(2)).toBe('InDevelopment');
        expect(service.getStatusLabel(3)).toBe('Backlog');
        expect(service.getStatusLabel(99)).toBe('Unknown');
    });
});
