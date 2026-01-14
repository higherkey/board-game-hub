import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { PlayComponent } from './play.component';
import { SignalRService } from '../../../services/signalr.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { GameDataService } from '../../../services/game-data.service';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

describe('PlayComponent', () => {
    let component: PlayComponent;
    let fixture: ComponentFixture<PlayComponent>;
    let mockSignalRService: any;
    let mockAuthService: any;
    let mockToastService: any;
    let mockGameDataService: any;

    beforeEach(async () => {
        mockSignalRService = {
            connectionStatus$: new BehaviorSubject('Connected'),
            startConnection: jasmine.createSpy('startConnection').and.returnValue(Promise.resolve()),
            getPublicRooms: jasmine.createSpy('getPublicRooms').and.returnValue(Promise.resolve([]))
        };

        mockAuthService = {
            currentUser$: of({ displayName: 'Test User' }),
            getGuestName: jasmine.createSpy('getGuestName').and.returnValue('Guest')
        };

        mockToastService = {
            show: jasmine.createSpy('show')
        };

        mockGameDataService = {
            games$: of([]),
            refreshGames: jasmine.createSpy('refreshGames')
        };

        await TestBed.configureTestingModule({
            imports: [PlayComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: ToastService, useValue: mockToastService },
                { provide: GameDataService, useValue: mockGameDataService },
                provideRouter([]),
                {
                    provide: LoggerService, useValue: {
                        debug: jasmine.createSpy('debug'),
                        info: jasmine.createSpy('info'),
                        warn: jasmine.createSpy('warn'),
                        error: jasmine.createSpy('error')
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PlayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load rooms on init', fakeAsync(() => {
        expect(mockSignalRService.getPublicRooms).toHaveBeenCalled();
    }));

    it('should refresh games on init', () => {
        expect(mockGameDataService.refreshGames).toHaveBeenCalled();
    });
});
