
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GreatMindsPlayerComponent } from './great-minds-player.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('GreatMindsPlayerComponent', () => {
    let component: GreatMindsPlayerComponent;
    let fixture: ComponentFixture<GreatMindsPlayerComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitGreatMindsCard: jasmine.createSpy('submitGreatMindsCard'),
            submitGreatMindsSync: jasmine.createSpy('submitGreatMindsSync')
        };

        await TestBed.configureTestingModule({
            imports: [GreatMindsPlayerComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GreatMindsPlayerComponent);
        component = fixture.componentInstance;
        component.gameState = { phase: 0, myHand: [10, 20] };
        component.myConnectionId = 'conn1';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
