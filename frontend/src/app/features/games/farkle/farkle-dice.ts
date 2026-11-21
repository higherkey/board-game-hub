import { TrayDie } from '../../../shared/components/dice-tray/dice-math';

export interface FarkleDieState { value: number; isHeld: boolean; isReserved: boolean }

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
