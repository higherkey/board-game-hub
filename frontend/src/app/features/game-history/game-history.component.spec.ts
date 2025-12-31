
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameHistoryComponent } from './game-history.component';
import { SignalRService } from '../../services/signalr.service';
import { CommonModule } from '@angular/common';
import { provideRouter } from '@angular/router';

describe('GameHistoryComponent', () => {
    let component: GameHistoryComponent;
    let fixture: ComponentFixture<GameHistoryComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getGameHistory: jasmine.createSpy('getGameHistory').and.returnValue(Promise.resolve([]))
        };

        await TestBed.configureTestingModule({
            imports: [GameHistoryComponent, CommonModule],
            providers: [
                provideRouter([]),
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GameHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetching history on init', () => {
        expect(mockSignalRService.getGameHistory).toHaveBeenCalled();
    });
});
