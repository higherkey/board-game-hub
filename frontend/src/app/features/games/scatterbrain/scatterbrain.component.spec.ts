import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScatterbrainComponent } from './scatterbrain.component';
import { SignalRService } from '../../../services/signalr.service';
import { FormsModule } from '@angular/forms';

describe('ScatterbrainComponent', () => {
    let component: ScatterbrainComponent;
    let fixture: ComponentFixture<ScatterbrainComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            // Mock methods as needed
        };

        await TestBed.configureTestingModule({
            imports: [ScatterbrainComponent, FormsModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ScatterbrainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
