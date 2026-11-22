import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('leads with the mission as the page heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Distance disappears at the game table');
  });

  it('should reference eight1five design studio', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const studioLink = compiled.querySelector('a[href="https://eight1fivedesign.com"]');
    expect(studioLink).toBeTruthy();
    expect(studioLink?.textContent).toContain('eight1five design');
  });

  it('explains the table and the hand, the three steps and where you can play', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = [...compiled.querySelectorAll('h2, h3')].map(h => h.textContent?.trim());
    expect(headings).toEqual(jasmine.arrayContaining(['Two screens, one game', 'The table', 'Your hand',
      'How a game night works', 'Host', 'Join', 'Play', 'Where you can play', 'In the same room', 'Miles apart']));
    expect(compiled.querySelector('#how-it-works')).not.toBeNull();
    expect(compiled.querySelector('a[href="/shelf"]')?.textContent).toContain('Host a game');
  });
});
