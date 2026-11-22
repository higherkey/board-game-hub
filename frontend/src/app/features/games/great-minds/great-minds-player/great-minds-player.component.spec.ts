
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GreatMindsPlayerComponent } from './great-minds-player.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../../shared/services/confirm.service';

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

    it('gives each card a flat colour, not a gradient', () => {
        expect(component.getGradient(10)).toBe('hsl(213, 60%, 36%)');
    });

    it('uses a sync token only after the player confirms', async () => {
        const confirm = spyOn(TestBed.inject(ConfirmService), 'confirm').and.resolveTo(false);
        await component.useSync();
        expect(mockSignalRService.submitGreatMindsSync).not.toHaveBeenCalled();
        confirm.and.resolveTo(true);
        await component.useSync();
        expect(mockSignalRService.submitGreatMindsSync).toHaveBeenCalled();
    });
});
