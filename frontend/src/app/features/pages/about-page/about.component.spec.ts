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

  it('should render mission and vision statements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Distance disappears at the game table');
    expect(compiled.textContent).toContain('Connecting people and making them feel right at the same table');
  });

  it('should reference eight1five design studio', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const studioLink = compiled.querySelector('a[href="https://eight1fivedesign.com"]');
    expect(studioLink).toBeTruthy();
    expect(studioLink?.textContent).toContain('eight1five design');
  });

  it('should render Table vs Hand concepts', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('How Table vs. Hand Works');
    expect(compiled.textContent).toContain('The Table Role');
    expect(compiled.textContent).toContain('The Hand Role');
  });
});
