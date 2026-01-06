
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SushiTrainComponent } from './sushi-train.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('SushiTrainComponent', () => {
    let component: SushiTrainComponent;
    let fixture: ComponentFixture<SushiTrainComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            // Add methods
        };

        await TestBed.configureTestingModule({
            imports: [SushiTrainComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SushiTrainComponent);
        component = fixture.componentInstance;
        component.room = {
            code: 'TEST',
            players: [],
            state: 'Playing',
            settings: { timerDurationSeconds: 60, letterMode: 0 },
            gameType: 'SushiTrain',
            gameState: {},
            gameData: { phase: 0 },
            roundNumber: 1,
            isPaused: false,
            roundScores: {},
            nextGameVotes: {},
            currentVote: null,
            undoSettings: { allowVoting: true, hostOnly: false }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
