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

    for (const compactMode of [false, true]) {
        for (const resultPhase of ['RoundResults', 'GameOver'] as const) {
            it('uses ' + resultPhase + ' despite edited round settings in ' + (compactMode ? 'compact' : 'expanded') + ' controls', () => {
                component.compactMode = compactMode;
                component.isIntermission = true;
                component.resultPhase = resultPhase;
                component.selectedGameType = 'Babble';
                component.currentRound = resultPhase === 'RoundResults' ? 50 : 1;
                component.settings.totalRounds = resultPhase === 'RoundResults' ? 1 : 50;
                component.players = [{ isReady: false, isScreen: false }] as any;
                spyOn(component.nextRound, 'emit');
                spyOn(component.playAgain, 'emit');
                spyOn(component.endGame, 'emit');
                fixture.detectChanges();
                const button = Array.from(fixture.nativeElement.querySelectorAll('button'))
                    .find((b: any) => b.textContent.includes(resultPhase === 'GameOver' ? 'PLAY AGAIN' : 'NEXT ROUND')) as HTMLButtonElement;
                expect(button).toBeTruthy();
                button.click();
                expect(resultPhase === 'GameOver' ? component.playAgain.emit : component.nextRound.emit).toHaveBeenCalledWith(component.settings);
                expect(component.endGame.emit).not.toHaveBeenCalled();
                if (resultPhase === 'GameOver') expect(fixture.nativeElement.textContent).toContain(compactMode ? 'END GAME' : 'END SESSION');
            });
        }
    }

    for (const resultPhase of [undefined, null]) {
        it('preserves legacy final-round action for phase ' + resultPhase, () => {
            component.resultPhase = resultPhase;
            component.isIntermission = true;
            component.currentRound = 5;
            component.settings.totalRounds = 5;
            spyOn(component.endGame, 'emit');
            component.confirmStart();
            expect(component.endGame.emit).toHaveBeenCalled();
        });
    }

    it('should call signalRService.setGameType when changeGameType is called', async () => {
        mockSignalRService.setGameType = jasmine.createSpy('setGameType').and.returnValue(Promise.resolve());
        component.roomCode = 'ROOM1';
        component.availableGames = [{ id: 'Coup', name: 'Coup' }] as any;
        await component.changeGameType('Coup');
        expect(mockSignalRService.setGameType).toHaveBeenCalledWith('ROOM1', 'Coup');
    });

    const buttonByText = (text: string) => Array.from(fixture.nativeElement.querySelectorAll('button'))
        .find((b: any) => b.textContent.includes(text)) as HTMLButtonElement | undefined;

    it('mid-round compact controls offer END GAME (ends the game) and no start button', () => {
        component.compactMode = true;
        component.isIntermission = false;
        spyOn(component.endGame, 'emit');
        spyOn(component.exitGame, 'emit');
        fixture.detectChanges();
        expect(buttonByText('START')).toBeUndefined();
        buttonByText('END GAME')!.click();
        expect(component.endGame.emit).toHaveBeenCalled();
        expect(component.exitGame.emit).not.toHaveBeenCalled();
    });

    it('between rounds compact END GAME returns the room to the lobby', () => {
        component.compactMode = true;
        component.isIntermission = true;
        component.resultPhase = 'RoundResults';
        spyOn(component.endGame, 'emit');
        spyOn(component.exitGame, 'emit');
        fixture.detectChanges();
        buttonByText('END GAME')!.click();
        expect(component.exitGame.emit).toHaveBeenCalled();
        expect(component.endGame.emit).not.toHaveBeenCalled();
    });

    it('switching games in compact controls asks first and keeps the game when cancelled', async () => {
        const confirm = TestBed.inject(ConfirmService).confirm as jasmine.Spy;
        confirm.and.returnValue(Promise.resolve(false));
        mockSignalRService.setGameType = jasmine.createSpy('setGameType').and.returnValue(Promise.resolve());
        component.compactMode = true;
        component.isIntermission = true;
        component.roomCode = 'ROOM1';
        component.currentGameType = 'Babble';
        component.availableGames = [{ id: 'Babble', name: 'Babble' }, { id: 'Farkle', name: 'Farkle' }] as any;
        await component.changeGameType('Farkle');
        expect(confirm).toHaveBeenCalled();
        expect(mockSignalRService.setGameType).not.toHaveBeenCalled();
        expect(component.selectedGameType).toBe('Babble');

        confirm.and.returnValue(Promise.resolve(true));
        await component.changeGameType('Farkle');
        expect(mockSignalRService.setGameType).toHaveBeenCalledWith('ROOM1', 'Farkle');
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

    describe("start gate", () => {
        const hands = (n: number) => Array.from({ length: n }, (_, i) =>
            ({ connectionId: "p" + i, name: "P" + i, score: 0, isHost: false, isReady: true, isScreen: false }));
        const tv = { connectionId: "tv", name: "TV", score: 0, isHost: true, isReady: true, isScreen: true };
        beforeEach(() => {
            component.availableGames = [{ id: "FourInARow", name: "Four in a Row", minPlayers: 2, maxPlayers: 2, timerType: 0 }] as any;
            component.selectedGameType = "FourInARow";
        });

        it("explains when too few players have joined, counting Hands only", () => {
            component.players = [tv, ...hands(1)] as any;
            expect(component.startBlocker).toBe("Four in a Row needs 2 players. 1 has joined.");
        });

        it("explains when too many players have joined", () => {
            component.players = hands(3) as any;
            expect(component.startBlocker).toBe("Four in a Row takes at most 2 players. 3 have joined.");
        });

        it("allows a start inside the range, and never blocks the next round", () => {
            component.players = hands(2) as any;
            expect(component.startBlocker).toBeNull();
            component.players = hands(1) as any;
            component.isIntermission = true;
            expect(component.startBlocker).toBeNull();
        });

        it("disables Start and shows the reason beside it", () => {
            component.players = hands(1) as any;
            fixture.detectChanges();
            const start = fixture.nativeElement.querySelector(".btn-start") as HTMLButtonElement;
            expect(start.disabled).toBeTrue();
            expect(start.getAttribute("aria-describedby")).toBe("start-blocker");
            expect(fixture.nativeElement.querySelector("#start-blocker").textContent).toContain("needs 2 players");
        });
    });
});
