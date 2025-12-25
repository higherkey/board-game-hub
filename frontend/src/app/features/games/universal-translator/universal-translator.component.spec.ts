import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UniversalTranslatorComponent } from './universal-translator.component';
import { SignalRService } from '../../../services/signalr.service';
import { of } from 'rxjs';

describe('UniversalTranslatorComponent', () => {
    let component: UniversalTranslatorComponent;
    let fixture: ComponentFixture<UniversalTranslatorComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('mock-id'),
            // Add other mocked methods here
        };

        await TestBed.configureTestingModule({
            imports: [UniversalTranslatorComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(UniversalTranslatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
