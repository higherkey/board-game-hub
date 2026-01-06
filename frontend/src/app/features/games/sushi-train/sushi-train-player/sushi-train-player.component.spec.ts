
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SushiTrainPlayerComponent } from './sushi-train-player.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('SushiTrainPlayerComponent', () => {
    let component: SushiTrainPlayerComponent;
    let fixture: ComponentFixture<SushiTrainPlayerComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitSushiTrainSelection: jasmine.createSpy('submitSushiTrainSelection'),
            toggleSushiTrainChopsticks: jasmine.createSpy('toggleSushiTrainChopsticks')
        };

        await TestBed.configureTestingModule({
            imports: [SushiTrainPlayerComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SushiTrainPlayerComponent);
        component = fixture.componentInstance;
        component.gameState = {
            phase: 0,
            playerStates: {
                'conn1': { hand: [], selectedCards: [] }
            }
        };
        component.currentUserId = 'conn1';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
