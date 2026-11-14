import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DesignConceptComponent } from './design-concept.component';

describe('DesignConceptComponent', () => {
  let fixture: ComponentFixture<DesignConceptComponent>;

  beforeEach(async () => {
    spyOn(globalThis, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    await TestBed.configureTestingModule({
      imports: [DesignConceptComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(DesignConceptComponent);
    fixture.detectChanges();
  });

  it('renders the shared hero once with the concept comparison banner', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('app-home-hero').length).toBe(1);
    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.querySelector('.dc-concept-flag')?.textContent).toContain('Design concept');
    expect(el.querySelector('.dc-concept-flag a')?.getAttribute('href')).toBe('/');
  });

  it('projects game and room navigation into the shared hero', () => {
    const hero: HTMLElement = fixture.nativeElement.querySelector('app-home-hero');
    expect(hero.querySelector('a[href="/games"]')?.textContent).toContain('Choose a Game');
    expect(hero.querySelector('a[href="/play"]')?.textContent).toContain('Join a Room');
  });
});