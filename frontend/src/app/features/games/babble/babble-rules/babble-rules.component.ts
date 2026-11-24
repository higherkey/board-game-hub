import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Babble's rules and scoring, matching BabbleService and BabbleGameService on the server. */
@Component({
    selector: 'app-babble-rules',
    standalone: true,
    template: `
        <ul class="babble-rules">
            <li>Make words by chaining letters that touch, diagonals included.</li>
            <li>Use each tile once per word. Words need 3 or more letters. <strong>Qu</strong> is one tile.</li>
            <li>A word someone else also found scores nothing for either of you.</li>
            <li>Words must be in the dictionary, unless the host accepts them.</li>
        </ul>
        <h3 class="babble-rules-title">Points per word</h3>
        <dl class="babble-rules-scores">
            @for (row of scoring; track row[0]) {
                <div class="babble-rules-row"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></div>
            }
        </dl>`,
    styleUrls: ['./babble-rules.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BabbleRulesComponent {
    protected readonly scoring: [string, string][] = [
        ['3–4 letters', '1'],
        ['5 letters', '2'],
        ['6 letters', '3'],
        ['7 letters', '5'],
        ['8 or more', '11']
    ];
}
