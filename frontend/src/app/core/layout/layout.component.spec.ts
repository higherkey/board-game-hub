import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { LayoutComponent } from './layout.component';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavbarComponent } from '../components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
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

  it('closes an open menu on Escape and returns focus to its toggle', () => {
    component.toggleMobileMenu();
    const toggle = component.navToggle!.nativeElement;
    const focus = spyOn(toggle, 'focus');
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(event);
    expect(component.mobileMenuOpen).toBeFalse();
    expect(focus).toHaveBeenCalled();
    expect(event.defaultPrevented).toBeTrue();
  });

  it('leaves Escape available to other controls while the menu is closed', () => {
    const focus = spyOn(component.navToggle!.nativeElement, 'focus');
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(event);
    expect(focus).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBeFalse();
  });

  it('should render the dynamic environment version in the footer chip', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const betaChip = compiled.querySelector('.footer-beta-chip');
    expect(betaChip?.textContent).toContain(component.version);
  });
  it('should link to the repository on GitHub in the footer', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const githubLink = compiled.querySelector<HTMLAnchorElement>('a.github-link');
    expect(githubLink?.href).toBe('https://github.com/higherkey/board-game-hub');
    expect(githubLink?.target).toBe('_blank');
    expect(githubLink?.rel).toContain('noopener');
    expect(githubLink?.rel).toContain('noreferrer');
  });
});
