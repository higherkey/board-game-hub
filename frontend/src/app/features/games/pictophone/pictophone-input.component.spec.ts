import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PictophoneInputComponent } from './pictophone-input.component';
import { SignalRService } from '../../../services/signalr.service';
import { FormsModule } from '@angular/forms';

describe('PictophoneInputComponent', () => {
    let component: PictophoneInputComponent;
    let fixture: ComponentFixture<PictophoneInputComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getPictophoneSuggestions: jasmine.createSpy('getPictophoneSuggestions').and.returnValue(Promise.resolve([]))
        };

        await TestBed.configureTestingModule({
            imports: [PictophoneInputComponent, FormsModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PictophoneInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
