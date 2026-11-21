import { TrayDie } from '../../../shared/components/dice-tray/dice-math';

export interface FarkleDieState { value: number; isHeld: boolean; isReserved: boolean }

/**
 * Keeps a roll's result off screen until this screen's dice have landed. The server sends the result
 * (say, a farkle) with the roll itself, so showing `state.phase` straight away would spoil the throw.
 */
export class FarkleLanding {
    private landedRollId?: number;
    private seen = false;

    /** The phase to show now: "Rolling" while the latest roll is still in the air here. */
    phase(state: { phase: string; rollId?: number }): string {
        if (!this.seen) {
            // First look (a refresh or a late join): the dice are already down.
            this.seen = true;
            this.landedRollId = state.rollId;
        }
        return state.rollId !== this.landedRollId ? 'Rolling' : state.phase;
    }

    /** Call from the dice tray's (settled) output. */
    land(rollId: number | undefined): void {
        this.landedRollId = rollId;
    }
}

/**
 * Farkle dice as the dice tray wants them: banked dice stay out of throws and cannot be tapped;
 * dice picked to keep are highlighted. Remembers its last answer so the tray only sees a change
 * when the server sends new dice.
 */
export function farkleTrayDice(): (dice: readonly FarkleDieState[] | undefined) => readonly TrayDie[] {
    let source: readonly FarkleDieState[] | undefined;
    let result: readonly TrayDie[] = [];
    return dice => {
        if (dice !== source) {
            source = dice;
            result = (dice ?? []).map(d => ({ value: d.value, held: d.isHeld, locked: d.isHeld, selected: d.isReserved }));
        }
        return result;
    };
}
