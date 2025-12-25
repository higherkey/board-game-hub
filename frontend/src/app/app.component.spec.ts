import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SignalRService } from './services/signalr.service';
import { of, BehaviorSubject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

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

    await TestBed.configureTestingModule({
      imports: [AppComponent], // Standalone
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: Title, useValue: mockTitleService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
