import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GreatMindsBoardComponent } from './great-minds-board.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';
import { Subject } from 'rxjs';

describe('GreatMindsBoardComponent', () => {
    let component: GreatMindsBoardComponent;
    let fixture: ComponentFixture<GreatMindsBoardComponent>;
    let mockGameEvents$: Subject<any>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockGameEvents$ = new Subject<any>();
        mockSignalRService = {
            gameEvents$: mockGameEvents$.asObservable(),
            startGame: jasmine.createSpy('startGame')
        };

        await TestBed.configureTestingModule({
            imports: [GreatMindsBoardComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GreatMindsBoardComponent);
        component = fixture.componentInstance;
        component.gameState = { phase: 0, currentLevel: 1, lives: 3 };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show Victory screen on VICTORY event', () => {
        mockGameEvents$.next({ type: 'VICTORY' });
        fixture.detectChanges();

        const overlay = fixture.nativeElement.querySelector('.game-over-overlay');
        expect(overlay).toBeTruthy();
        expect(overlay.textContent).toContain('TRANSCENDENCE ACHIEVED');
    });

    it('should show Defeat screen when lives are 0', () => {
        component.gameState = { ...component.gameState, lives: 0 };
        component.ngOnChanges({
            gameState: {
                currentValue: component.gameState,
                previousValue: {},
                firstChange: false,
                isFirstChange: () => false
            }
        });
        fixture.detectChanges();

        const overlay = fixture.nativeElement.querySelector('.game-over-overlay');
        expect(overlay).toBeTruthy();
        expect(overlay.textContent).toContain('CONNECTION LOST');
    });

    it('should call restartGame when Host clicks PLAY AGAIN', () => {
        component.isHost = true;
        component.gameState = { ...component.gameState, lives: 0 }; // Trigger defeat
        fixture.detectChanges();

        const btn = fixture.nativeElement.querySelector('.restart-btn');
        expect(btn).toBeTruthy();
        btn.click();

        expect(mockSignalRService.startGame).toHaveBeenCalled();
    });
});
