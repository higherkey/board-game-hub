import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService, RoomStats } from '../../services/admin.service';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { of, BehaviorSubject } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('AdminDashboardComponent', () => {
    let component: AdminDashboardComponent;
    let fixture: ComponentFixture<AdminDashboardComponent>;
    let mockAdminService: jasmine.SpyObj<AdminService>;
    let mockGameDataService: jasmine.SpyObj<GameDataService>;
    let statsSubject: BehaviorSubject<RoomStats | null>;
    let connectionStatusSubject: BehaviorSubject<string>;

    beforeEach(async () => {
        statsSubject = new BehaviorSubject<RoomStats | null>(null);
        connectionStatusSubject = new BehaviorSubject<string>('Disconnected');

        mockAdminService = jasmine.createSpyObj('AdminService', [
            'startConnection', 'stopConnection', 'refreshStats', 
            'getGames', 'createRoom', 'sendGlobalMessage', 
            'updateSettings', 'startGame', 'terminateRoom', 'updateGame'
        ]);
        
        // Setup properties on mock
        Object.defineProperty(mockAdminService, 'stats$', { get: () => statsSubject.asObservable() });
        Object.defineProperty(mockAdminService, 'connectionStatus$', { get: () => connectionStatusSubject.asObservable() });
        
        mockAdminService.getGames.and.returnValue(of([{ id: 'Game1', name: 'Game One' } as GameDefinition]));
        mockAdminService.createRoom.and.returnValue(of({ code: 'ROOM' }));
        mockAdminService.sendGlobalMessage.and.returnValue(of(undefined));
        mockAdminService.updateSettings.and.returnValue(of(undefined));
        mockAdminService.startGame.and.returnValue(of(undefined));
        mockAdminService.terminateRoom.and.returnValue(of(undefined));

        mockGameDataService = jasmine.createSpyObj('GameDataService', ['getGames']);

        await TestBed.configureTestingModule({
            imports: [AdminDashboardComponent, FormsModule],
            providers: [
                { provide: AdminService, useValue: mockAdminService },
                { provide: GameDataService, useValue: mockGameDataService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminDashboardComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        // Stop any remaining timers
        if (component['refreshSub']) {
            component['refreshSub'].unsubscribe();
        }
    });

    it('should create and load initial data on init', fakeAsync(() => {
        fixture.detectChanges(); // Triggers ngOnInit
        tick(); // Flush any pending microtasks
        
        expect(component).toBeTruthy();
        expect(mockAdminService.startConnection).toHaveBeenCalled();
        expect(mockAdminService.getGames).toHaveBeenCalled();
        expect(component.games.length).toBe(1);
        
        discardPeriodicTasks(); // Clear the interval
    }));

    it('should update stats and connection status from service', () => {
        fixture.detectChanges();
        
        let currentStatus: string = '';
        component.connectionStatus$.subscribe(status => currentStatus = status);
        
        connectionStatusSubject.next('Connected');
        expect(currentStatus).toBe('Connected');
    });

    it('should handle creating a room', () => {
        fixture.detectChanges();
        
        component.createHostName = 'TestHost';
        component.createGameType = 'TestGame';
        component.submitCreateRoom();
        
        expect(mockAdminService.createRoom).toHaveBeenCalledWith('TestHost', 'TestGame');
        expect(component.showCreateModal).toBeFalse();
        expect(mockAdminService.refreshStats).toHaveBeenCalled();
    });

    it('should handle sending a global message', () => {
        fixture.detectChanges();
        
        component.globalMessageContent = 'Hello World';
        component.submitGlobalMessage();
        
        expect(mockAdminService.sendGlobalMessage).toHaveBeenCalledWith('Hello World');
        expect(component.showMessageModal).toBeFalse();
        expect(component.globalMessageContent).toBe('');
    });
});
