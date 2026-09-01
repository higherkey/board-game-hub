
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WisecrackPlayerComponent } from './wisecrack-player.component';
import { SignalRService } from '../../../../services/signalr.service';
import { createMockRoom } from '../../../../shared/testing/test-helpers';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('WisecrackPlayerComponent', () => {
    let component: WisecrackPlayerComponent;
    let fixture: ComponentFixture<WisecrackPlayerComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitWisecrackAnswer: jasmine.createSpy('submitWisecrackAnswer'),
            submitWisecrackVote: jasmine.createSpy('submitWisecrackVote')
        };

        await TestBed.configureTestingModule({
            imports: [WisecrackPlayerComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WisecrackPlayerComponent);
        component = fixture.componentInstance;

        // Mock Inputs using Helper
        component.room = createMockRoom({
            gameType: 'Wisecrack',
            gameData: {
                phase: 'WRITING',
                prompts: {},
                answers: {}
            }
        });
        component.playerId = 'conn1';

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should bind myConnectionId via playerId setter', () => {
        component.playerId = 'conn99';
        expect(component.myId).toBe('conn99');
    });

    it('should submit answer via SignalRService', () => {
        component.inputs['prompt-1'] = 'Hilarious joke';
        component.submitAnswer('prompt-1');
        expect(mockSignalRService.submitWisecrackAnswer).toHaveBeenCalledWith('prompt-1', 'Hilarious joke');
    });

    it('should submit vote via SignalRService', () => {
        component.vote(0);
        expect(component.votedChoice).toBe(0);
        expect(mockSignalRService.submitWisecrackVote).toHaveBeenCalledWith(0);
    });
});
