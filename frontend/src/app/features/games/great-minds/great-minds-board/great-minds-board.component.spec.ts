
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GreatMindsBoardComponent } from './great-minds-board.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';
import { of } from 'rxjs';

describe('GreatMindsBoardComponent', () => {
    let component: GreatMindsBoardComponent;
    let fixture: ComponentFixture<GreatMindsBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GreatMindsBoardComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: { gameEvents$: of(null) } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GreatMindsBoardComponent);
        component = fixture.componentInstance;
        component.gameState = { phase: 0, currentLevel: 1 };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
