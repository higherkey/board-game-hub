import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamesComponent } from './games.component';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('GamesComponent', () => {
  let component: GamesComponent;
  let fixture: ComponentFixture<GamesComponent>;
  let mockSignalRService: any;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockSignalRService = {
      connectionStatus$: new BehaviorSubject('Disconnected'),
      startConnection: jasmine.createSpy('startConnection').and.returnValue(Promise.resolve()),
      getPublicRooms: jasmine.createSpy('getPublicRooms').and.returnValue(Promise.resolve([])),
      createRoom: jasmine.createSpy('createRoom').and.returnValue(Promise.resolve('ABCD')),
      joinRoom: jasmine.createSpy('joinRoom').and.returnValue(Promise.resolve(true))
    };

    mockAuthService = {
      currentUser$: of(null)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [GamesComponent, FormsModule],
      providers: [
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load rooms on init', () => {
    expect(mockSignalRService.startConnection).toHaveBeenCalled();
    expect(mockSignalRService.getPublicRooms).toHaveBeenCalled();
  });

  it('should auto-fill player name if logged in', () => {
    // Re-create component with auth user
    mockAuthService.currentUser$ = of({ displayName: 'TestUser' });
    TestBed.overrideProvider(AuthService, { useValue: mockAuthService });
    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.playerName).toBe('TestUser');
  });

  it('createRoom should prompt if name hidden', async () => {
    component.playerName = 'HostUser';
    await component.createRoom('Scatterbrain');
    expect(mockSignalRService.createRoom).toHaveBeenCalledWith('HostUser', true, 'Scatterbrain');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', 'ABCD'], { queryParams: { name: 'HostUser' } });
  });

  it('joinRoom should navigate on success', async () => {
    component.playerName = 'Joiner';
    await component.joinRoom('ABCD');
    expect(mockSignalRService.joinRoom).toHaveBeenCalledWith('ABCD', 'Joiner');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', 'ABCD'], { queryParams: { name: 'Joiner' } });
  });
});
