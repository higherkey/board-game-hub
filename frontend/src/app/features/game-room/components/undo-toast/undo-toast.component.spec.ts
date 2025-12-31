
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UndoToastComponent } from './undo-toast.component';
import { SignalRService } from '../../../../services/signalr.service';
import { CommonModule } from '@angular/common';

describe('UndoToastComponent', () => {
    let component: UndoToastComponent;
    let fixture: ComponentFixture<UndoToastComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitUndoVote: jasmine.createSpy('submitUndoVote')
        };

        await TestBed.configureTestingModule({
            imports: [UndoToastComponent, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UndoToastComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
