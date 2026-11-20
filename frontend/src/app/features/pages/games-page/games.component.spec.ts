import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GamesComponent } from './games.component';
import { GameDataService } from '../../../services/game-data.service';

const game = (id: string, status: string, min: number, max: number, minutes: number, tags: string, description = '') =>
  ({ id, name: id, status, minPlayers: min, maxPlayers: max, averagePlayTime: minutes, tags, description });

describe('GamesComponent', () => {
  let fixture: ComponentFixture<GamesComponent>;
  let el: HTMLElement;
  let mockGameDataService: any;

  beforeEach(async () => {
    mockGameDataService = {
      games$: of([
        game('Yacht', 'Testing', 1, 8, 30, 'Dice,Strategy'),
        game('Babble', 'Testing', 1, 8, 10, 'Word,Puzzle', 'Find words on a grid'),
        game('Warships', 'InDevelopment', 2, 2, 15, 'Strategy'),
        game('Terminal', 'Backlog', 2, 5, 20, 'Cooperative')
      ]),
      refreshGames: jasmine.createSpy('refreshGames')
    };

    await TestBed.configureTestingModule({
      imports: [GamesComponent],
      providers: [provideRouter([]), { provide: GameDataService, useValue: mockGameDataService }]
    }).compileComponents();

    fixture = TestBed.createComponent(GamesComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  const click = (selector: string, text?: string) => {
    const target = [...el.querySelectorAll<HTMLElement>(selector)].find(b => !text || b.textContent?.trim().startsWith(text));
    target!.click();
    fixture.detectChanges();
  };
  const names = () => [...el.querySelectorAll('.game-card .gb-title')].map(t => t.textContent?.trim());

  it('shows every game on the shelf, playable first, and leaves backlog games off', () => {
    expect(mockGameDataService.refreshGames).toHaveBeenCalled();
    expect(el.querySelector('h1')?.textContent).toBe('The shelf');
    expect(names()).toEqual(['Babble', 'Yacht', 'Warships']);
    expect(el.querySelector('main')).toBeNull();
  });

  it('builds playlists only from games that fit them', () => {
    const lists = [...el.querySelectorAll('.shelf-playlist-title')].map(t => t.textContent?.trim());
    expect(lists).toContain('Good with 2');
    expect(lists).toContain('Dice games');
    expect(lists).not.toContain('Drawing games');
  });

  it('searches names, descriptions and tags', () => {
    const input = el.querySelector<HTMLInputElement>('input[type=search]')!;
    input.value = 'grid';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(names()).toEqual(['Babble']);
    expect(el.querySelector('#shelf-results')?.textContent).toContain('1 game match');

    input.value = 'strategy';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(names()).toEqual(['Yacht', 'Warships']);
  });

  it('filters by player count with a pressed state and a removable chip', () => {
    click('.shelf-option--count', '2');
    expect(el.querySelector('.shelf-option--count[aria-pressed=true]')?.textContent?.trim()).toBe('2');
    expect(names()).toEqual(['Babble', 'Yacht', 'Warships']);

    click('.shelf-option--count', '8+');
    expect(names()).toEqual(['Babble', 'Yacht']);

    click('.shelf-chip');
    expect(el.querySelector('#shelf-all')).not.toBeNull();
  });

  it('opens a playlist as results and clears back to browsing', () => {
    click('.shelf-playlist', 'Dice games');
    expect(names()).toEqual(['Yacht']);
    expect(el.querySelector('.shelf-chip')?.textContent).toContain('Dice games');

    click('.shelf-clear');
    expect(el.querySelector('#shelf-lists')).not.toBeNull();
  });

  it('filters by length, names each filter in a chip and removes them one at a time', () => {
    click('.shelf-option', 'Under 15 min');
    expect(names()).toEqual(['Babble']);
    click('.shelf-option', '15 to 30 min');
    expect(names()).toEqual(['Yacht', 'Warships']);
    click('.shelf-option', 'Longer');
    expect(names()).toEqual([]);
    expect(el.querySelector('.shelf-empty')).not.toBeNull();

    click('.shelf-option--count', '1');
    const chips = [...el.querySelectorAll('.shelf-chip')].map(c => c.textContent?.trim());
    expect(chips).toEqual(['1 player', 'Longer']);
    click('.shelf-option', 'Longer');
    click('.shelf-option--count', '1');
    expect(el.querySelector('#shelf-all')).not.toBeNull();
  });

  it('sorts A to Z or shortest first', () => {
    const select = el.querySelector<HTMLSelectElement>('#shelf-all ~ .shelf-sort select, .shelf-select')!;
    select.value = 'name';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(names()).toEqual(['Babble', 'Warships', 'Yacht']);

    select.value = 'time';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(names()).toEqual(['Babble', 'Warships', 'Yacht']);
    click('.shelf-option--count', '2');
    expect(names()).toEqual(['Babble', 'Warships', 'Yacht']);
  });

  it('jumps to search on "/" unless the visitor is already typing', () => {
    const input = el.querySelector<HTMLInputElement>('input[type=search]')!;
    const slash = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    document.body.dispatchEvent(slash);
    expect(document.activeElement).toBe(input);
    expect(slash.defaultPrevented).toBeTrue();

    const typed = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    input.dispatchEvent(typed);
    expect(typed.defaultPrevented).toBeFalse();

    const withCtrl = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true, cancelable: true });
    input.blur();
    document.body.dispatchEvent(withCtrl);
    expect(withCtrl.defaultPrevented).toBeFalse();
  });

  it('offers to host playable games and to try coming-soon games early', () => {
    click('.shelf-option--count', '2');
    const actions = [...el.querySelectorAll('.shelf-host')].map(a => a.textContent?.trim());
    expect(actions).toEqual(['Host', 'Host', 'Try it early']);
  });
});
