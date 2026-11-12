import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YachtComponent } from './yacht.component';
import { Room, SignalRService } from '../../../services/signalr.service';
import { YachtState } from './yacht.models';

describe('YachtComponent', () => {
  let fixture: ComponentFixture<YachtComponent>;
  let component: YachtComponent;
  let transport: jasmine.SpyObj<SignalRService>;
  let state: YachtState;

  beforeEach(async () => {
    transport = jasmine.createSpyObj('SignalRService', ['submitGameAction']);
    transport.submitGameAction.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [YachtComponent], providers: [{ provide: SignalRService, useValue: transport }]
    }).compileComponents();
    fixture = TestBed.createComponent(YachtComponent);
    component = fixture.componentInstance;
    state = {
      phase: 'Playing', playerOrder: ['p1', 'p2'], activePlayerId: 'p1', turnNumber: 1,
      rollsUsed: 1, dice: [1, 2, 3, 4, 6], held: [false, false, false, false, false],
      availableScores: { Ones: 1, Yacht: 0, SmallStraight: 30 }, winnerIds: [], lastMove: '',
      scorecards: {
        p1: { playerName: 'Isaac', categories: {}, upperSubtotal: 0, upperBonus: 0, yachtBonus: 0, total: 0 },
        p2: { playerName: 'Winter', categories: {}, upperSubtotal: 0, upperBonus: 0, yachtBonus: 0, total: 0 }
      }
    };
    fixture.componentRef.setInput('room', { gameData: state, state: 'Playing', isPaused: false } as Room);
    fixture.componentRef.setInput('myConnectionId', 'p1');
    fixture.detectChanges();
  });

  it('shows the shared dice and scorecards without Table action controls', async () => {
    fixture.componentRef.setInput('isTable', true);
    fixture.componentRef.setInput('isScreen', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.die').length).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('Isaac');
    expect(fixture.nativeElement.querySelector('.category-picker')).toBeNull();
    expect(fixture.nativeElement.querySelector('.roll-button')).toBeNull();
    await component.roll();
    await component.toggleDie(0);
    expect(transport.submitGameAction).not.toHaveBeenCalled();
  });

  it('confirms a zero before committing a category', async () => {
    component.chooseCategory('Yacht');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Take zero & end turn');
    expect(transport.submitGameAction).not.toHaveBeenCalled();
    await component.confirmScore();
    expect(transport.submitGameAction).toHaveBeenCalledWith('SCORE', { category: 'Yacht' });
    expect(component.pendingCategory).toBeNull();
  });

  it('only lets the active Hand choose unused legal slots', async () => {
    component.chooseCategory('FullHouse');
    expect(component.pendingCategory).toBeNull();
    fixture.componentRef.setInput('myConnectionId', 'p2');
    fixture.detectChanges();
    await component.roll();
    component.chooseCategory('Ones');
    await component.confirmScore();
    expect(transport.submitGameAction).not.toHaveBeenCalled();
  });

  it('blocks rolls after the third roll and when every die is held', async () => {
    state.rollsUsed = 3;
    await component.roll();
    await component.toggleDie(0);
    state.rollsUsed = 2;
    state.held.fill(true);
    await component.roll();
    expect(transport.submitGameAction).not.toHaveBeenCalled();
  });

  it('sends hold actions and blocks duplicate actions while awaiting the server', async () => {
    let resolve!: () => void;
    transport.submitGameAction.and.returnValue(new Promise<void>(done => resolve = done));
    const action = component.toggleDie(2);
    expect(component.busy).toBeTrue();
    await component.roll();
    expect(transport.submitGameAction).toHaveBeenCalledOnceWith('TOGGLE_DIE', { index: 2 });
    resolve();
    await action;
    expect(component.busy).toBeFalse();
  });

  it('shows actionable feedback when transport fails', async () => {
    transport.submitGameAction.and.callFake(async () => { throw new Error('Disconnected'); });
    await component.roll();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Check your connection');
    expect(component.busy).toBeFalse();
  });

  it('renders every tied winner after completion', () => {
    state.phase = 'GameOver';
    state.winnerIds = ['p1', 'p2'];
    fixture.componentRef.setInput('room', { ...component.room, gameData: { ...state } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.victory').textContent).toContain('Isaac & Winter tie for the win!');
    expect(fixture.nativeElement.querySelector('.category-picker')).toBeNull();
  });

  it('clears stale selection on turn changes and blocks actions while paused', async () => {
    component.chooseCategory('Ones');
    state.activePlayerId = 'p2';
    component.ngOnChanges();
    expect(component.pendingCategory).toBeNull();
    state.activePlayerId = 'p1';
    component.room.isPaused = true;
    await component.roll();
    expect(transport.submitGameAction).not.toHaveBeenCalled();
  });
});
