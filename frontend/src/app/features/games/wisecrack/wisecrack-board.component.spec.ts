
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WisecrackBoardComponent } from './wisecrack-board.component';
import { SignalRService } from '../../../services/signalr.service';
import { createMockRoom } from '../../../shared/testing/test-helpers';
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
            nextWisecrackBattle: jasmine.createSpy('nextWisecrackBattle')
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
                phase: 'WRITING',
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
});
