import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GreatMindsGameComponent } from './great-minds.component';
import { SignalRService } from '../../../../services/signalr.service';
import { of } from 'rxjs';

describe('GreatMindsGameComponent', () => {
    let component: GreatMindsGameComponent;
    let fixture: ComponentFixture<GreatMindsGameComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('mock-connection-id'),
            gameState$: of(null)
        };

        await TestBed.configureTestingModule({
            imports: [GreatMindsGameComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(GreatMindsGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
