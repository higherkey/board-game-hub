import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../services/auth.service';
import { SignalRService } from '../../../services/signalr.service';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    const mockAuthService = {
      currentUser$: of(null),
      isAuthenticated: () => false,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout')
    };

    const mockSignalRService = {
      connectionStatus$: new BehaviorSubject('Disconnected')
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: SignalRService, useValue: mockSignalRService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
