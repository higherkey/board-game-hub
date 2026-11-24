import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Clover-Minded's rules, from the game README and CloverMindedGameService. */
@Component({
    selector: 'app-clover-rules',
    standalone: true,
    template: `
        <p>A team game: everyone wins or loses together.</p>
        <h3>Write clues</h3>
        <p>Your clover has four keyword cards. Each edge shows two words side by side. Write one single-word clue that links each pair.</p>
        <h3>Solve a clover</h3>
        <p>One player's clover is solved at a time. That player is the Spectator: their four cards and one decoy go to the middle, and they stay silent.</p>
        <p>Everyone else places four cards in the right slots, turned the right way, so each clue sits between its two words.</p>
        <h3>Score</h3>
        <ul>
            <li>First try: 1 point per correct card, plus 2 if all four are right.</li>
            <li>Wrong cards come back for a second try: 1 point per correct card.</li>
        </ul>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CloverRulesComponent {}
