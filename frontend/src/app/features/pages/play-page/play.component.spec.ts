import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { PlayComponent } from './play.component';
import { SignalRService } from '../../../services/signalr.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { GameDataService } from '../../../services/game-data.service';
import { Router, provideRouter } from '@angular/router';
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
            publicRooms$: new BehaviorSubject([]),
            startConnection: jasmine.createSpy('startConnection').and.returnValue(Promise.resolve()),
            getPublicRooms: jasmine.createSpy('getPublicRooms').and.returnValue(Promise.resolve([])),
            joinLobby: jasmine.createSpy('joinLobby').and.returnValue(Promise.resolve()),
            leaveLobby: jasmine.createSpy('leaveLobby')
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

    it('should join lobby on init', fakeAsync(() => {
        expect(mockSignalRService.joinLobby).toHaveBeenCalled();
    }));

    it('should refresh games on init', () => {
        expect(mockGameDataService.refreshGames).toHaveBeenCalled();
    });

    describe('joinWithCode', () => {
        let router: Router;

        beforeEach(() => {
            router = TestBed.inject(Router);
            spyOn(router, 'navigate');
            mockToastService.showError = jasmine.createSpy('showError');
            mockSignalRService.validateRoomCode = jasmine.createSpy('validateRoomCode').and.returnValue(Promise.resolve(true));
        });

        it('should set codeError if roomCode length is not 4', async () => {
            component.roomCode = 'ABC';
            await component.joinWithCode();
            expect(component.codeError).toBe('Please enter a valid 4-letter room code.');
            expect(mockSignalRService.validateRoomCode).not.toHaveBeenCalled();
        });

        it('should navigate to /game/CODE when room code is valid and exists', async () => {
            component.roomCode = 'test';
            mockSignalRService.validateRoomCode.and.returnValue(Promise.resolve(true));

            await component.joinWithCode();

            expect(mockSignalRService.validateRoomCode).toHaveBeenCalledWith('TEST');
            expect(router.navigate).toHaveBeenCalledWith(['/game', 'TEST']);
            expect(component.codeError).toBeNull();
            expect(component.isValidating).toBeFalse();
        });

        it('should display error and toast if room code is not found', async () => {
            component.roomCode = 'FAIL';
            mockSignalRService.validateRoomCode.and.returnValue(Promise.resolve(false));

            await component.joinWithCode();

            expect(mockSignalRService.validateRoomCode).toHaveBeenCalledWith('FAIL');
            expect(component.codeError).toContain('Room "FAIL" not found');
            expect(mockToastService.showError).toHaveBeenCalledWith('Room "FAIL" does not exist.');
            expect(component.isValidating).toBeFalse();
        });

        it('should handle errors when room code validation throws', async () => {
            component.roomCode = 'ERRR';
            mockSignalRService.validateRoomCode.and.returnValue(Promise.reject(new Error('Network error')));

            await component.joinWithCode();

            expect(component.codeError).toBe('Unable to verify room code right now.');
            expect(mockToastService.showError).toHaveBeenCalledWith('Unable to verify room code.');
            expect(component.isValidating).toBeFalse();
        });
    });

    it('should clear codeError on onCodeInput', () => {
        component.codeError = 'Invalid code';
        component.onCodeInput();
        expect(component.codeError).toBeNull();
    });

    it('should get host name or Unknown', () => {
        expect(component.getHostName([{ name: 'Alice', isHost: true }, { name: 'Bob', isHost: false }])).toBe('Alice');
        expect(component.getHostName([{ name: 'Bob', isHost: false }])).toBe('Unknown');
    });

    it('should load rooms on loadRooms', async () => {
        mockSignalRService.getPublicRooms.and.returnValue(Promise.resolve([]));
        await component.loadRooms();
        expect(mockSignalRService.getPublicRooms).toHaveBeenCalled();
        expect(component.loading).toBeFalse();
    });
});

