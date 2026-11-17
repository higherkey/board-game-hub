import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FourInARowRoom } from '../four-in-a-row.models';

@Component({
    selector: 'app-four-in-a-row-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './four-in-a-row-board.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./four-in-a-row-board.component.scss']
})
export class FourInARowBoardComponent {
    @Input() room?: FourInARowRoom;
    @Input() interactive = false;
    @Output() columnDrop = new EventEmitter<number>();
    readonly columns = [0, 1, 2, 3, 4, 5, 6];
    readonly rows = [0, 1, 2, 3, 4, 5];

    isWinning(column: number, row: number): boolean {
        return this.room?.gameData?.winningCells?.some(cell => cell.column === column && cell.row === row) ?? false;
    }

    cellLabel(column: number, row: number): string {
        const value = this.room?.gameData?.grid?.[column]?.[row] ?? 0;
        return `Row ${row + 1}, column ${column + 1}: ${value === 1 ? 'Red, 1' : value === 2 ? 'Yellow, 2' : 'empty'}${this.isWinning(column, row) ? ', winning line' : ''}`;
    }
}
