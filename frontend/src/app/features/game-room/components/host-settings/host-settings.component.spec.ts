import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostSettingsComponent } from './host-settings.component';
import { SignalRService } from '../../../../services/signalr.service';
import { GameDataService } from '../../../../services/game-data.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
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
                provideHttpClient(),
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

    it('should alert if startGame is called with no players', () => {
        spyOn(globalThis, 'alert');
        component.players = [];
        component.startGame();
        expect(globalThis.alert).toHaveBeenCalledWith('Cannot start the game! No players in the room.');
    });

    it('should prompt confirm if startGame is called and not all players are ready', async () => {
        const confirmService = TestBed.inject(ConfirmService);
        component.players = [
            { name: 'P1', isReady: true, isScreen: false },
            { name: 'P2', isReady: false, isScreen: false }
        ] as any;
        await component.startGame();
        expect(confirmService.confirm).toHaveBeenCalled();
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

    it('should alert if onToggleReady is called without a game selected (as screen)', () => {
        spyOn(globalThis, 'alert');
        component.selectedGameType = 'None';
        component.isScreen = true;
        component.isHostOverride = false;
        component.onToggleReady();
        expect(globalThis.alert).toHaveBeenCalledWith('Please select a game first!');
    });
});
