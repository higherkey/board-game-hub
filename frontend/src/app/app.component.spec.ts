import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SignalRService } from './services/signalr.service';
import { AuthService } from './services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NavbarComponent } from './core/components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStubComponent { }

describe('AppComponent', () => {
  let mockRouter: any;
  let mockSignalRService: any;
  let mockTitleService: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };
    mockSignalRService = {
      currentRoom$: new BehaviorSubject(null),
      activeRooms$: new BehaviorSubject([])
    };
    mockTitleService = {
      setTitle: jasmine.createSpy('setTitle')
    };
    mockActivatedRoute = {
      snapshot: {}
    };

    const mockAuthService = {
      currentUser$: new BehaviorSubject(null),
      session$: new BehaviorSubject(null),
      isAuthenticated: () => false,
      getGuestId: () => 'guest-id',
      getGuestName: () => 'Guest'
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, NavbarStubComponent], // Standalone
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Title, useValue: mockTitleService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .overrideComponent(AppComponent, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStubComponent] }
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
