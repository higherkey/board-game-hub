
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WisecrackBoardComponent } from './wisecrack-board.component';
import { SignalRService } from '../../../../services/signalr.service';
import { createMockRoom } from '../../../../shared/testing/test-helpers';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('WisecrackBoardComponent', () => {
    let component: WisecrackBoardComponent;
    let fixture: ComponentFixture<WisecrackBoardComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitWisecrackAnswer: jasmine.createSpy('submitWisecrackAnswer'),
            submitWisecrackVote: jasmine.createSpy('submitWisecrackVote'),
            nextWisecrackBattle: jasmine.createSpy('nextWisecrackBattle'),
            nextRound: jasmine.createSpy('nextRound')
        };

        await TestBed.configureTestingModule({
            imports: [WisecrackBoardComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WisecrackBoardComponent);
        component = fixture.componentInstance;

        // Mock Inputs using Helper
        component.room = createMockRoom({
            gameType: 'Wisecrack',
            gameData: {
                phase: 'Writing',
                prompts: { 'p1': 'Why did the chicken cross?' },
                answers: {},
                battles: [],
                currentBattleIndex: 0,
                scores: {}
            }
        });

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show writing phase initially', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.writing-phase')).toBeTruthy();
    });

    it('should call nextBattle when Host clicks Next Battle in Battling phase', () => {
        component.room = createMockRoom({
            gameType: 'Wisecrack',
            gameData: {
                phase: 'Battling',
                currentBattleIndex: 0,
                battles: [{
                    prompt: 'Prompt',
                    answerA: { id: 'a', text: 'A', playerId: 'a' },
                    answerB: { id: 'b', text: 'B', playerId: 'b' },
                    isFinished: true,
                    winnerPlayerId: 'a',
                    votes: []
                }]
            }
        });
        component.isHost = true;
        fixture.detectChanges();

        const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
        const nextBattleBtn = buttons.find(b => b.textContent?.includes('Next Battle'));

        expect(nextBattleBtn).toBeTruthy();
        nextBattleBtn?.click();
        expect(mockSignalRService.nextWisecrackBattle).toHaveBeenCalled();
    });

    it('should call nextRound when Host clicks Next Round in Result phase', () => {
        component.room = createMockRoom({
            gameType: 'Wisecrack',
            gameData: {
                phase: 'Result',
                scores: { 'conn1': 10 }
            }
        });
        component.isHost = true;
        fixture.detectChanges();

        const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
        const nextRoundBtn = buttons.find(b => (b as HTMLButtonElement).textContent?.includes('Next Round'));

        expect(nextRoundBtn).toBeTruthy();
        (nextRoundBtn as HTMLButtonElement).click();
        expect(mockSignalRService.nextRound).toHaveBeenCalled();
    });
});
