import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostSettingsComponent } from './host-settings.component';
import { SignalRService } from '../../../../services/signalr.service';
import { GameDataService } from '../../../../services/game-data.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { of } from 'rxjs';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('HostSettingsComponent', () => {
    let component: HostSettingsComponent;
    let fixture: ComponentFixture<HostSettingsComponent>;
    let mockSignalRService: any;
    let mockGameDataService: any;

    beforeEach(async () => {
        mockSignalRService = {
            currentRoomSubject: { value: null },
            getScatterbrainLists: jasmine.createSpy('getScatterbrainLists').and.returnValue(Promise.resolve([]))
        };

        mockGameDataService = {
            games$: of([]),
            refreshGames: jasmine.createSpy('refreshGames')
        };

        const mockConfirmService = {
            confirm: jasmine.createSpy('confirm').and.returnValue(Promise.resolve(true))
        };

        await TestBed.configureTestingModule({
            imports: [HostSettingsComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: GameDataService, useValue: mockGameDataService },
                { provide: ConfirmService, useValue: mockConfirmService },
                provideHttpClient(withXhr()),
                provideHttpClientTesting()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HostSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit exitGame when emitsExitGame is called', () => {
        spyOn(component.exitGame, 'emit');
        component.emitExitGame();
        expect(component.exitGame.emit).toHaveBeenCalled();
    });

    it('should warn locally if startGame is called with no players', () => {
        const toast = TestBed.inject(ToastService);
        spyOn(toast, 'showWarning');
        component.players = [];
        spyOn(component.gameStart, 'emit');
        component.startGame();
        expect(component.gameStart.emit).not.toHaveBeenCalled();
        expect(toast.showWarning).toHaveBeenCalledWith('Cannot start the game! No players in the room.');
    });

    it('should block startGame and warn when not all players are ready and no override (#66)', () => {
        const toast = TestBed.inject(ToastService);
        spyOn(toast, 'showWarning');
        spyOn(component.gameStart, 'emit');
        component.isIntermission = false;
        component.isHostOverride = false;
        component.players = [
            { name: 'P1', isReady: true, isScreen: false },
            { name: 'P2', isReady: false, isScreen: false }
        ] as any;
        component.startGame();
        expect(toast.showWarning).toHaveBeenCalled();
        expect(component.gameStart.emit).not.toHaveBeenCalled();
    });

    it('should start when host override is active even if players are not ready (#66)', () => {
        spyOn(component.gameStart, 'emit');
        component.isIntermission = false;
        component.isHostOverride = true;
        component.players = [
            { name: 'P1', isReady: false, isScreen: false }
        ] as any;
        component.startGame();
        expect(component.gameStart.emit).toHaveBeenCalled();
    });

    it('should not gate next round on readiness during intermission', () => {
        spyOn(component.nextRound, 'emit');
        component.isIntermission = true;
        component.isHostOverride = false;
        component.currentRound = 1;
        component.settings = { ...component.settings, totalRounds: 5 };
        component.players = [
            { name: 'P1', isReady: false, isScreen: false }
        ] as any;
        component.startGame();
        expect(component.nextRound.emit).toHaveBeenCalled();
    });

    it('should emit gameStart if all players are ready', () => {
        spyOn(component.gameStart, 'emit');
        component.players = [
            { name: 'P1', isReady: true, isScreen: false },
            { name: 'P2', isReady: true, isScreen: false }
        ] as any;
        component.isIntermission = false;
        component.startGame();
        expect(component.gameStart.emit).toHaveBeenCalled();
    });

    it('should call signalRService.setGameType when changeGameType is called', async () => {
        mockSignalRService.setGameType = jasmine.createSpy('setGameType').and.returnValue(Promise.resolve());
        component.roomCode = 'ROOM1';
        component.availableGames = [{ id: 'Coup', name: 'Coup' }] as any;
        await component.changeGameType('Coup');
        expect(mockSignalRService.setGameType).toHaveBeenCalledWith('ROOM1', 'Coup');
    });

    it('should warn locally if onToggleReady is called without a game selected (as screen)', () => {
        const toast = TestBed.inject(ToastService);
        spyOn(toast, 'showWarning');
        component.selectedGameType = 'None';
        component.isScreen = true;
        component.isHostOverride = false;
        spyOn(component.toggleReady, 'emit');
        component.onToggleReady();
        expect(component.toggleReady.emit).not.toHaveBeenCalled();
        expect(toast.showWarning).toHaveBeenCalledWith('Please select a game first!');
    });
});
