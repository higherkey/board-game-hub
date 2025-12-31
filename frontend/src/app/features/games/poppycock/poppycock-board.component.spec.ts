import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoppycockBoardComponent } from './poppycock-board.component';
import { SignalRService } from '../../../services/signalr.service';
import { createMockRoom } from '../../../shared/testing/test-helpers';
import { CommonModule } from '@angular/common';

describe('PoppycockBoardComponent', () => {
    let component: PoppycockBoardComponent;
    let fixture: ComponentFixture<PoppycockBoardComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            nextRound: jasmine.createSpy('nextRound')
        };

        await TestBed.configureTestingModule({
            imports: [PoppycockBoardComponent, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PoppycockBoardComponent);
        component = fixture.componentInstance;
        component.room = createMockRoom({
            gameType: 'Poppycock',
            gameData: {
                phase: 0,
                currentPrompt: { word: 'Test Word', category: 'Test Cat' }
            }
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show waiting message in Phase 0', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('Waiting for definitions');
    });

    it('should call nextRound when Host clicks Next Round in Phase 2', () => {
        component.room = createMockRoom({
            gameType: 'Poppycock',
            gameData: { phase: 2, votes: {}, correctSubmissions: [] }
        });
        component.isHost = true;
        fixture.detectChanges();

        const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
        const nextRoundBtn = buttons.find(b => b.textContent?.includes('Next Round'));

        expect(nextRoundBtn).toBeTruthy();
        nextRoundBtn?.click();
        expect(mockSignalRService.nextRound).toHaveBeenCalled();
    });
});
