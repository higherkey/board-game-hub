import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveGamesComponent } from './active-games.component';
import { SignalRService } from '../../services/signalr.service';
import { Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('ActiveGamesComponent', () => {
    let component: ActiveGamesComponent;
    let fixture: ComponentFixture<ActiveGamesComponent>;
    let mockSignalRService: any;
    let mockRouter: any;
    let activeRoomsSubject: BehaviorSubject<any[]>;

    beforeEach(async () => {
        activeRoomsSubject = new BehaviorSubject<any[]>([]);

        mockSignalRService = {
            activeRooms$: activeRoomsSubject.asObservable(),
            validateActiveRooms: jasmine.createSpy('validateActiveRooms'),
            removeActiveRoom: jasmine.createSpy('removeActiveRoom')
        };

        mockRouter = {
            navigate: jasmine.createSpy('navigate'),
            events: new BehaviorSubject<any>(null)
        };

        await TestBed.configureTestingModule({
            imports: [ActiveGamesComponent], // Standalone
            providers: [
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: Router, useValue: mockRouter }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ActiveGamesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle dropdown and validate rooms when opening', () => {
        expect(component.isOpen).toBeFalse();

        // Simulate click
        const btn = fixture.debugElement.query(By.css('.active-tables-btn'));
        btn.nativeElement.click();

        expect(component.isOpen).toBeTrue();
        expect(mockSignalRService.validateActiveRooms).toHaveBeenCalled();

        // Toggle close
        btn.nativeElement.click();
        expect(component.isOpen).toBeFalse();
    });

    it('should display active rooms count', () => {
        activeRoomsSubject.next([{ code: 'ABCD', gameType: 'Scatterbrain' }, { code: 'EFGH', gameType: 'Babble' }]);
        fixture.detectChanges();

        const badge = fixture.debugElement.query(By.css('.badge'));
        expect(badge.nativeElement.textContent.trim()).toBe('2');
    });

    it('should navigate to room when clicked', () => {
        component.isOpen = true; // Open to see list
        activeRoomsSubject.next([{ code: 'ABCD', gameType: 'Scatterbrain' }]);
        fixture.detectChanges();

        const item = fixture.debugElement.query(By.css('.game-item'));
        item.nativeElement.click();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', 'ABCD']);
        expect(component.isOpen).toBeFalse();
    });

    it('should call removeActiveRoom when remove button is clicked', () => {
        component.isOpen = true;
        activeRoomsSubject.next([{ code: 'ABCD', gameType: 'Scatterbrain' }]);
        fixture.detectChanges();

        const removeBtn = fixture.debugElement.query(By.css('.remove-btn'));
        removeBtn.triggerEventHandler('click', new Event('click')); // Use trigger to handle stopPropagation check if possible, or just click

        expect(mockSignalRService.removeActiveRoom).toHaveBeenCalledWith('ABCD');
    });
});
