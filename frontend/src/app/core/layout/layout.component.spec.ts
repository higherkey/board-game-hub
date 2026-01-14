import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { LayoutComponent } from './layout.component';
import { Component } from '@angular/core';
import { NavbarComponent } from '../components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStubComponent { }

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { currentUser$: of(null), isAuthenticated: () => false }
        },
        {
          provide: SignalRService,
          useValue: {
            connectionStatus$: new BehaviorSubject('Disconnected'),
            activeRooms$: of([])
          }
        }
      ]
    })
      .overrideComponent(LayoutComponent, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStubComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
