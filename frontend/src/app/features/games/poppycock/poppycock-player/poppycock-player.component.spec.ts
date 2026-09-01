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

    it('should submit definition via SignalRService and emit output', () => {
        spyOn(component.definitionSubmitted, 'emit');
        component.definition = 'A type of ox';
        component.submitDef();

        expect(component.definitionSubmitted.emit).toHaveBeenCalledWith('A type of ox');
        expect(signalRMock.submitPoppycockDefinition).toHaveBeenCalledWith('A type of ox');
        expect(component.hasSubmitted).toBeTrue();
    });

    it('should submit vote via SignalRService and emit output', () => {
        spyOn(component.voteSubmitted, 'emit');
        component.submitVote('conn2');

        expect(component.voteSubmitted.emit).toHaveBeenCalledWith('conn2');
        expect(signalRMock.submitPoppycockVote).toHaveBeenCalledWith('conn2');
        expect(component.hasVoted).toBeTrue();
    });
});
