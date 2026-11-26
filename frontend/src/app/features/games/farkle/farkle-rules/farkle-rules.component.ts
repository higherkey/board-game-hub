import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Farkle's rules and scoring, matching FarkleService on the server. Shown in the rules drawer and on the Table. */
@Component({
    selector: 'app-farkle-rules',
    standalone: true,
    templateUrl: './farkle-rules.component.html',
    styleUrls: ['./farkle-rules.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FarkleRulesComponent {
    protected readonly scoring: [string, string][] = [
        ['Single 1', '100'],
        ['Single 5', '50'],
        ['Three 1s', '300'],
        ['Three of a kind', 'Face × 100'],
        ['Four of a kind', '1,000'],
        ['Five of a kind', '2,000'],
        ['Six of a kind', '3,000'],
        ['Straight 1–6', '1,500'],
        ['Three pairs', '1,500'],
        ['Four of a kind + a pair', '1,500'],
        ['Two triples', '2,500']
    ];
}
