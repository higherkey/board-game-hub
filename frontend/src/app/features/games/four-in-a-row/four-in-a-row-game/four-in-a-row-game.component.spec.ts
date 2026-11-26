import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FourInARowGameComponent } from './four-in-a-row-game.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FourInARowRoom } from '../four-in-a-row.models';
import { GameChromeService } from '../../../game-room/services/game-chrome.service';

describe('FourInARowGameComponent', () => {
    let fixture: ComponentFixture<FourInARowGameComponent>;
    let component: FourInARowGameComponent;
    let transport: jasmine.SpyObj<SignalRService>;
    let room: FourInARowRoom;

    function render(): void {
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        transport = jasmine.createSpyObj('SignalRService', ['sendGameAction']);
        await TestBed.configureTestingModule({
            imports: [FourInARowGameComponent],
            providers: [{ provide: SignalRService, useValue: transport }, GameChromeService]
        }).compileComponents();
        fixture = TestBed.createComponent(FourInARowGameComponent);
        component = fixture.componentInstance;
        room = {
            state: 'Playing', players: [{ connectionId: 'red', name: 'Alice' }, { connectionId: 'yellow', name: 'Bob' }],
            gameData: { phase: 'Playing', currentPlayerId: 'red', winnerId: '', playerOrder: ['red', 'yellow'],
                grid: Array.from({ length: 7 }, () => Array(6).fill(0)), moveCount: 0, winningCells: [], lastMove: null }
        };
        component.room = room;
        component.myConnectionId = 'red';
        render();
    });

    it('renders a real 42-cell board and sends an accessible column choice', () => {
        expect(fixture.nativeElement.querySelectorAll('[role="cell"]').length).toBe(42);
        const button = fixture.nativeElement.querySelector('[aria-label="Drop in column 3"]');
        button.click();
        expect(transport.sendGameAction).toHaveBeenCalledOnceWith('DROP', { column: 2 });
        expect(component.status).toBe('Alice’s turn');
    });

    it('lets a host Hand play but keeps a non-host Table read-only', () => {
        component.isHost = true;
        render();
        expect(fixture.nativeElement.querySelectorAll('.drop-controls button').length).toBe(7);
        component.isHost = false;
        component.isScreen = true;
        render();
        expect(fixture.nativeElement.querySelector('.drop-controls')).toBeNull();
        component.drop(2);
        expect(transport.sendGameAction).not.toHaveBeenCalled();
    });

    it('hides controls for waiting, paused, and finished players', () => {
        room.gameData!.currentPlayerId = 'yellow';
        render();
        expect(fixture.nativeElement.querySelector('.drop-controls')).toBeNull();
        component.drop(1);
        room.gameData!.currentPlayerId = 'red';
        room.isPaused = true;
        render();
        expect(component.status).toContain('paused');
        expect(fixture.nativeElement.querySelector('.drop-controls')).toBeNull();
        component.drop(1);
        room.isPaused = false;
        room.state = 'Finished';
        room.gameData!.phase = 'GameOver';
        room.gameData!.winnerId = 'yellow';
        render();
        expect(component.status).toContain('Bob wins!');
        component.drop(1);
        expect(transport.sendGameAction).not.toHaveBeenCalled();
    });

    it('disables full columns and labels tokens and the winning line without relying on color', () => {
        room.gameData!.grid[0] = [1, 2, 1, 2, 1, 2];
        room.gameData!.winningCells = [{ column: 0, row: 0 }];
        render();
        expect(fixture.nativeElement.querySelector('[aria-label="Drop in column 1"]').disabled).toBeTrue();
        expect(fixture.nativeElement.querySelector('[aria-label="Row 1, column 1: Red, 1, winning line"]')).not.toBeNull();
    });

    it('publishes status, colours and rules, and leaves the header to the room', () => {
        fixture.componentRef.setInput('room', { ...room });
        fixture.detectChanges();
        const chrome = TestBed.inject(GameChromeService);
        expect(chrome.status()).toBe('Alice’s turn');
        expect(chrome.scores()).toEqual([
            { id: 'red', name: 'Alice', score: 'Red', active: true, isMe: true },
            { id: 'yellow', name: 'Bob', score: 'Yellow', active: false, isMe: false }
        ]);
        expect(chrome.rules()).not.toBeNull();
        const el: HTMLElement = fixture.nativeElement;
        for (const sel of ['header', 'h2', '.status', '.players', '.end-hint']) expect(el.querySelector(sel)).withContext(sel).toBeNull();
        room.gameData!.phase = 'GameOver';
        expect(component.status).toContain('Draw!');
    });

    it('puts the column buttons under the board, in thumb reach', () => {
        const board = fixture.nativeElement.querySelector('.board');
        const controls = fixture.nativeElement.querySelector('.drop-controls');
        expect(board.compareDocumentPosition(controls) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});
