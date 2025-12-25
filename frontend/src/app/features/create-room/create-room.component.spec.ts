import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateRoomComponent } from './create-room.component';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { GameDataService } from '../../services/game-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('CreateRoomComponent', () => {
    let component: CreateRoomComponent;
    let fixture: ComponentFixture<CreateRoomComponent>;

    let mockSignalRService: any;
    let mockAuthService: any;
    let mockRouter: any;
    let mockToastService: any;
    let mockGameDataService: any;
    let mockActiveRoute: any;

    beforeEach(async () => {
        mockSignalRService = {
            createRoom: jasmine.createSpy('createRoom').and.resolveTo('ABCD'),
            connectionStatus$: new BehaviorSubject('Connected'),
            startConnection: jasmine.createSpy('startConnection').and.resolveTo()
        };

        mockAuthService = {
            currentUser$: new BehaviorSubject(null),
            currentUserValue: null,
            getGuestName: jasmine.createSpy('getGuestName').and.returnValue('Guest'),
            setGuestName: jasmine.createSpy('setGuestName')
        };

        mockRouter = {
            navigate: jasmine.createSpy('navigate')
        };

        mockToastService = {
            showError: jasmine.createSpy('showError')
        };

        mockGameDataService = {
            loadGames: jasmine.createSpy('loadGames').and.returnValue(of([
                { id: 'Scatterbrain', name: 'Scatterbrain', status: 'Deployed' },
                { id: 'Babble', name: 'Babble', status: 'Deployed' }
            ]))
        };

        mockActiveRoute = {
            queryParams: of({})
        };

        await TestBed.configureTestingModule({
            imports: [CreateRoomComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter },
                { provide: ToastService, useValue: mockToastService },
                { provide: GameDataService, useValue: mockGameDataService },
                { provide: ActivatedRoute, useValue: mockActiveRoute }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on init', () => {
        expect(component.games.length).toBe(2);
        expect(component.filteredGames.length).toBe(2);
    });

    it('should filter games when searching', () => {
        component.searchTerm = 'Scat';
        component.filterGames();
        expect(component.filteredGames.length).toBe(1);
        expect(component.filteredGames[0].id).toBe('Scatterbrain');
    });

    it('should select game properly', () => {
        const game = component.games[1]; // Babble
        component.selectGame(game);
        expect(component.selectedGameType).toBe('Babble');
        expect(component.searchTerm).toBe('Babble');
        expect(component.showDropdown).toBeFalse();
    });

    it('should create room successfully', async () => {
        component.nickname = 'TestUser';
        component.selectedGameType = 'Scatterbrain';

        await component.createRoom();

        expect(mockSignalRService.createRoom).toHaveBeenCalledWith('TestUser', true, 'Scatterbrain');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', 'ABCD']);
    });

    it('should start connection if disconnected before creating room', async () => {
        mockSignalRService.connectionStatus$.next('Disconnected');
        component.nickname = 'TestUser';

        await component.createRoom();

        expect(mockSignalRService.startConnection).toHaveBeenCalled();
        expect(mockSignalRService.createRoom).toHaveBeenCalled();
    });

    it('should save guest name if not logged in', async () => {
        component.nickname = 'GuestUser';
        // Auth service mocks user as null by default

        await component.createRoom();

        expect(mockAuthService.setGuestName).toHaveBeenCalledWith('GuestUser');
    });
});
