import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostSettingsComponent } from './host-settings.component';
import { SignalRService } from '../../../../services/signalr.service';
import { GameDataService } from '../../../../services/game-data.service';
import { of } from 'rxjs';
import { EventEmitter } from '@angular/core';

describe('HostSettingsComponent', () => {
    let component: HostSettingsComponent;
    let fixture: ComponentFixture<HostSettingsComponent>;
    let mockSignalRService: any;
    let mockGameDataService: any;

    beforeEach(async () => {
        mockSignalRService = {
            currentRoomSubject: { value: null },
            getScatterbrainLists: jasmine.createSpy('getScatterbrainLists').and.returnValue(Promise.resolve([]))
        };

        mockGameDataService = {
            games$: of([]),
            refreshGames: jasmine.createSpy('refreshGames')
        };

        await TestBed.configureTestingModule({
            imports: [HostSettingsComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: GameDataService, useValue: mockGameDataService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HostSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit exitGame when emitsExitGame is called', () => {
        spyOn(component.exitGame, 'emit');
        component.emitExitGame();
        expect(component.exitGame.emit).toHaveBeenCalled();
    });
});
