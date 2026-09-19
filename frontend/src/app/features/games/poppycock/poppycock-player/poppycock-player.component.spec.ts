import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoppycockPlayerComponent } from './poppycock-player.component';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../../../services/signalr.service';

describe('PoppycockPlayerComponent', () => {
    let component: PoppycockPlayerComponent;
    let fixture: ComponentFixture<PoppycockPlayerComponent>;
    let signalRMock: any;

    beforeEach(async () => {
        signalRMock = {
            submitPoppycockDefinition: jasmine.createSpy('submitPoppycockDefinition'),
            submitPoppycockVote: jasmine.createSpy('submitPoppycockVote'),
            pauseGame: jasmine.createSpy('pauseGame'),
            resumeGame: jasmine.createSpy('resumeGame'),
            endRound: jasmine.createSpy('endRound')
        };

        await TestBed.configureTestingModule({
            imports: [PoppycockPlayerComponent, FormsModule],
            providers: [
                { provide: SignalRService, useValue: signalRMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PoppycockPlayerComponent);
        component = fixture.componentInstance;
        component.myConnectionId = 'conn1';
        component.room = {
            roundNumber: 1,
            gameData: {
                phase: 0,
                currentPrompt: { category: 'Word', word: 'Flummox', realDefinition: 'To confuse' }
            }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should reset state on phase change via ngOnChanges', () => {
        component.gameData = { phase: 0 };
        component.hasSubmitted = true;
        component.definition = 'test';

        component.room = {
            roundNumber: 1,
            gameData: {
                phase: 1,
                currentPrompt: { realDefinition: 'Real' },
                playerSubmissions: { 'conn2': 'Fake definition' }
            }
        };
        component.ngOnChanges({
            room: {
                currentValue: component.room,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false
            }
        });

        expect(component.hasVoted).toBeFalse();
        expect(component.shuffledDefinitions.length).toBe(2);
    });

    it('should convert index to uppercase letter', () => {
        expect(component.getLetter(0)).toBe('A');
        expect(component.getLetter(1)).toBe('B');
        expect(component.getLetter(2)).toBe('C');
    });

    it('should submit definition via SignalRService and emit output', () => {
        spyOn(component.definitionSubmitted, 'emit');
        component.definition = 'A type of ox';
        component.submitDef();

        expect(component.definitionSubmitted.emit).toHaveBeenCalledWith('A type of ox');
        expect(signalRMock.submitPoppycockDefinition).toHaveBeenCalledWith('A type of ox');
        expect(component.hasSubmitted).toBeTrue();
    });

    it('should not submit vote for self', () => {
        spyOn(component.voteSubmitted, 'emit');
        component.submitVote('conn1'); // Same as myConnectionId

        expect(component.voteSubmitted.emit).not.toHaveBeenCalled();
        expect(signalRMock.submitPoppycockVote).not.toHaveBeenCalled();
    });

    it('should submit vote via SignalRService and emit output', () => {
        spyOn(component.voteSubmitted, 'emit');
        component.submitVote('conn2');

        expect(component.voteSubmitted.emit).toHaveBeenCalledWith('conn2');
        expect(signalRMock.submitPoppycockVote).toHaveBeenCalledWith('conn2');
        expect(component.hasVoted).toBeTrue();
    });

    it('should execute host administrative controls', () => {
        component.pauseGame();
        expect(signalRMock.pauseGame).toHaveBeenCalled();

        component.resumeGame();
        expect(signalRMock.resumeGame).toHaveBeenCalled();

        component.endRound();
        expect(signalRMock.endRound).toHaveBeenCalled();
    });
});
