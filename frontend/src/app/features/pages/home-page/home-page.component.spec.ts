import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LandingPageComponent } from './home-page.component';
import { provideRouter, Router } from '@angular/router';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { SignalRService } from '../../../services/signalr.service';
import { BehaviorSubject } from 'rxjs';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let mockGameDataService: any;
  let mockSignalRService: any;
  let router: Router;
  let gamesSubject: BehaviorSubject<GameDefinition[] | null>;

  beforeEach(async () => {
    spyOn(globalThis, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    gamesSubject = new BehaviorSubject<GameDefinition[] | null>([
      { id: '1', title: 'Game 1', status: 'Deployed' } as any,
      { id: '2', title: 'Game 2', status: 'Testing' } as any,
      { id: '3', title: 'Game 3', status: 'Development' } as any,
      { id: '4', title: 'Game 4', status: 'Deployed' } as any,
      { id: '5', title: 'Game 5', status: 'Testing' } as any
    ]);

    mockGameDataService = {
      games$: gamesSubject.asObservable(),
      refreshGames: jasmine.createSpy('refreshGames')
    };

    mockSignalRService = {
      validateRoomCode: jasmine.createSpy('validateRoomCode').and.returnValue(Promise.resolve(true))
    };

    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
        provideRouter([]),
        { provide: GameDataService, useValue: mockGameDataService },
        { provide: SignalRService, useValue: mockSignalRService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and populate featured games with Deployed or Testing status', () => {
    expect(component).toBeTruthy();
    expect(mockGameDataService.refreshGames).toHaveBeenCalled();
    expect(component.featuredGames.length).toBe(3);
    expect(component.featuredGames.map(g => g.id)).toEqual(['1', '2', '4']);
  });

  it('submits a typed room code when the expanded arrow is clicked', async () => {
    component.isCodeInputFocused = true;
    component.roomCode = 'ABCD';
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.join-cap-btn').click();
    await fixture.whenStable();
    expect(mockSignalRService.validateRoomCode).toHaveBeenCalledWith('ABCD');
    expect(component.roomCode).toBe('ABCD');
  });

  it('renders one shared hero heading without the concept banner or legacy showcase', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('app-home-hero').length).toBe(1);
    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.querySelector('h1')?.textContent).toContain('Game night,');
    expect(el.querySelector('.dc-concept-flag')).toBeNull();
    expect(el.querySelector('.showcase-tv, .showcase-phone, .hero-steps-grid')).toBeNull();
  });

  it('keeps room controls, the beta note and lower page sections with the shared hero', () => {
    const el: HTMLElement = fixture.nativeElement;
    const hero = el.querySelector('app-home-hero')!;
    expect(hero.querySelector('[aria-label="Join a Room"]')).not.toBeNull();
    expect(hero.querySelector('[aria-label="4-letter room code"]')).not.toBeNull();
    expect(hero.querySelector('[aria-label="Enter room code directly"]')).not.toBeNull();
    expect(el.querySelector('.hero-beta-note')?.textContent).toContain('Public Beta');
    expect(el.querySelector('#hiw-heading')?.textContent).toContain('Table vs. Hand');
    expect(el.querySelector('#games-preview-heading')?.textContent).toBe('Featured Games');
    expect(el.querySelectorAll('.preview-card').length).toBe(3);
  });

  describe('toggleCodeEntry', () => {
    it('should open code input and trigger focus timeout when closed', fakeAsync(() => {
      component.isCodeInputFocused = false;
      component.codeError = 'Previous error';
      component.codeInputRef = {
        nativeElement: {
          focus: jasmine.createSpy('focus')
        }
      } as any;

      component.toggleCodeEntry();

      expect(component.isCodeInputFocused).toBeTrue();
      expect(component.codeError).toBeNull();

      tick(50);
      expect(component.codeInputRef?.nativeElement.focus).toHaveBeenCalled();
    }));

    it('should close code input and reset roomCode and error when already open', () => {
      component.isCodeInputFocused = true;
      component.roomCode = 'ABCD';
      component.codeError = 'Error';

      component.toggleCodeEntry();

      expect(component.isCodeInputFocused).toBeFalse();
      expect(component.roomCode).toBe('');
      expect(component.codeError).toBeNull();
    });
  });

  describe('onJoinBtnClick', () => {
    it('should navigate to /play when room code is empty or less than 4 characters', async () => {
      component.roomCode = 'AB';
      await component.onJoinBtnClick();
      expect(router.navigate).toHaveBeenCalledWith(['/play']);
      expect(mockSignalRService.validateRoomCode).not.toHaveBeenCalled();
    });

    it('should navigate to /game/CODE when room code is valid and exists', async () => {
      component.roomCode = 'abcd';
      mockSignalRService.validateRoomCode.and.returnValue(Promise.resolve(true));

      await component.onJoinBtnClick();

      expect(mockSignalRService.validateRoomCode).toHaveBeenCalledWith('ABCD');
      expect(router.navigate).toHaveBeenCalledWith(['/game', 'ABCD']);
      expect(component.isValidating).toBeFalse();
      expect(component.codeError).toBeNull();
    });

    it('should display error message when room code is not found', async () => {
      component.roomCode = 'WXYZ';
      mockSignalRService.validateRoomCode.and.returnValue(Promise.resolve(false));

      await component.onJoinBtnClick();

      expect(mockSignalRService.validateRoomCode).toHaveBeenCalledWith('WXYZ');
      expect(router.navigate).not.toHaveBeenCalledWith(['/game', 'WXYZ']);
      expect(component.codeError).toContain('Room "WXYZ" not found');
      expect(component.isValidating).toBeFalse();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector<HTMLInputElement>('[aria-label="4-letter room code"]')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      const error = errorId ? el.querySelector(`#${errorId}`) : null;
      expect(error?.getAttribute('role')).toBe('alert');
      expect(error?.textContent).toContain('Room "WXYZ" not found');
    });

    it('should display fallback error message when validateRoomCode throws an exception', async () => {
      component.roomCode = 'FAIL';
      mockSignalRService.validateRoomCode.and.returnValue(Promise.reject(new Error('Network error')));

      await component.onJoinBtnClick();

      expect(component.codeError).toBe('Unable to verify room code right now. Please try again.');
      expect(component.isValidating).toBeFalse();
    });
  });

  describe('code focus, blur, and input handlers', () => {
    it('should clear codeError on input', () => {
      component.codeError = 'Some error';
      component.onCodeInput();
      expect(component.codeError).toBeNull();
    });

    it('should set isCodeInputFocused and clear codeError on focus', () => {
      component.isCodeInputFocused = false;
      component.codeError = 'Some error';
      component.onCodeFocus();
      expect(component.isCodeInputFocused).toBeTrue();
      expect(component.codeError).toBeNull();
    });

    it('should close code input on blur if roomCode is empty', fakeAsync(() => {
      component.isCodeInputFocused = true;
      component.roomCode = '   ';
      component.onCodeBlur();
      tick(200);
      expect(component.isCodeInputFocused).toBeFalse();
    }));

    it('should keep code input open on blur if roomCode is present', fakeAsync(() => {
      component.isCodeInputFocused = true;
      component.roomCode = 'ABCD';
      component.onCodeBlur();
      tick(200);
      expect(component.isCodeInputFocused).toBeTrue();
    }));
  });
});

