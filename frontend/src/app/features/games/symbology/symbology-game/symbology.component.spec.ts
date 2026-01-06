import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SymbologyComponent } from './symbology.component';
import { SignalRService } from '../../../../services/signalr.service';
import { AuthService } from '../../../../services/auth.service';

describe('SymbologyComponent', () => {
    let component: SymbologyComponent;
    let fixture: ComponentFixture<SymbologyComponent>;
    let mockSignalRService: any;
    let mockAuthService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('test-id'),
            submitGuess: jasmine.createSpy('submitGuess'),
            symbologyPlaceMarker: jasmine.createSpy('symbologyPlaceMarker'),
            symbologyRemoveMarker: jasmine.createSpy('symbologyRemoveMarker')
        };

        mockAuthService = {};

        await TestBed.configureTestingModule({
            imports: [SymbologyComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: AuthService, useValue: mockAuthService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SymbologyComponent);
        component = fixture.componentInstance;
        component.room = {
            gameData: { activePlayerId: 'test-id', currentWord: 'test' },
            players: []
        } as any;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
