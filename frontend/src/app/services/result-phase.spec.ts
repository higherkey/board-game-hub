import { getRoomResultPhase, SignalRService } from './signalr.service';
import { createMockRoom } from '../shared/testing/test-helpers';
import { BabbleComponent } from '../features/games/babble/babble-game/babble.component';
import { GameReviewComponent } from '../features/game-room/components/game-review/game-review.component';
import { WisecrackBoardComponent } from '../features/games/wisecrack/wisecrack-board/wisecrack-board.component';
import { PoppycockBoardComponent } from '../features/games/poppycock/poppycock-board/poppycock-board.component';
import { DeepfakeGameComponent } from '../features/games/deepfake-game/deepfake-game/deepfake-game.component';

describe('Result phase projection and continuations', () => {
  it('uses server authority ahead of a legacy fallback', () => {
    expect(getRoomResultPhase({ resultPhase: 'GameOver' }, 'RoundResults')).toBe('GameOver');
    expect(getRoomResultPhase({ resultPhase: 'RoundResults' }, 'GameOver')).toBe('RoundResults');
    expect(getRoomResultPhase({ resultPhase: null }, 'RoundResults')).toBe('RoundResults');
    expect(getRoomResultPhase({}, 'GameOver')).toBe('GameOver');
  });

  const controls = [
    { name: 'Babble', create: (s: SignalRService) => new BabbleComponent(s), action: 'handleNextRound' },
    { name: 'Review', create: (s: SignalRService) => new GameReviewComponent(s), action: 'nextRound' },
    { name: 'Wisecrack', create: (s: SignalRService) => new WisecrackBoardComponent(s), action: 'nextRound' },
    { name: 'Poppycock', create: (s: SignalRService) => new PoppycockBoardComponent(s), action: 'nextRound' },
    { name: 'Deepfake', create: (s: SignalRService) => new DeepfakeGameComponent(s), action: 'handleNextRound' }
  ];
  for (const control of controls) {
    for (const resultPhase of ['RoundResults', 'GameOver', null, undefined] as const) {
      it(control.name + ' routes ' + resultPhase + ' without guessing from round settings', () => {
        const signal = jasmine.createSpyObj<SignalRService>('SignalRService', ['nextRound', 'playAgain']);
        const component: any = control.create(signal);
        component.isHost = true;
        component.room = createMockRoom({ state: 'Finished', resultPhase, roundNumber: 9, settings: { timerDurationSeconds: 60, letterMode: 0, totalRounds: 1 } });
        component[control.action]();
        expect(resultPhase === 'GameOver' ? signal.playAgain : signal.nextRound).toHaveBeenCalledTimes(1);
        expect(resultPhase === 'GameOver' ? signal.nextRound : signal.playAgain).not.toHaveBeenCalled();
      });
    }
  }
});
