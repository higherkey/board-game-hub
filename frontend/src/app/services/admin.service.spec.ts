import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
    let service: AdminService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AdminService]
        });
        service = TestBed.inject(AdminService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should GET stats', () => {
        service.getStats().subscribe();
        const req = httpMock.expectOne('/admin/stats');
        expect(req.request.method).toBe('GET');
        req.flush({});
    });

    it('should POST createRoom', () => {
        service.createRoom('Host', 'Game').subscribe();
        const req = httpMock.expectOne('/admin/rooms/create');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ hostName: 'Host', gameType: 'Game' });
        req.flush({ code: 'ABC' });
    });

    it('should POST startGame', () => {
        service.startGame('CODE').subscribe();
        const req = httpMock.expectOne('/admin/rooms/CODE/start');
        expect(req.request.method).toBe('POST');
        req.flush(null);
    });

    it('should POST terminateRoom', () => {
        service.terminateRoom('CODE').subscribe();
        const req = httpMock.expectOne('/admin/rooms/CODE/terminate');
        expect(req.request.method).toBe('POST');
        req.flush(null);
    });

    it('should POST updateSettings', () => {
        const settings = { timerDurationSeconds: 120 };
        service.updateSettings('CODE', settings).subscribe();
        const req = httpMock.expectOne('/admin/rooms/CODE/settings');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(settings);
        req.flush(null);
    });

    it('should GET games', () => {
        service.getGames().subscribe();
        const req = httpMock.expectOne('/admin/games');
        expect(req.request.method).toBe('GET');
        req.flush([]);
    });

    it('should PUT updateGame', () => {
        const game = { id: '1', name: 'Test' };
        service.updateGame('1', game).subscribe();
        const req = httpMock.expectOne('/admin/games/1');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(game);
        req.flush(null);
    });

    it('should POST sendGlobalMessage', () => {
        service.sendGlobalMessage('Hello').subscribe();
        const req = httpMock.expectOne('/admin/rooms/message');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ message: 'Hello', target: 'global' });
        req.flush(null);
    });
});
