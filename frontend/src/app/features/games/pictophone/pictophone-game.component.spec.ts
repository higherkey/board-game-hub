import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PictophoneGameComponent } from './pictophone-game.component';
import { SignalRService } from '../../../services/signalr.service';

describe('PictophoneGameComponent', () => {
    let component: PictophoneGameComponent;
    let fixture: ComponentFixture<PictophoneGameComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('mock-id'),
            // Add other mocked methods as needed
        };

        await TestBed.configureTestingModule({
            imports: [PictophoneGameComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PictophoneGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
