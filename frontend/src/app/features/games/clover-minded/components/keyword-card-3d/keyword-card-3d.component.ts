import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CloverCardModel } from '../../clover-minded.types';

@Component({
    selector: 'app-keyword-card-3d',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            class="card-3d"
            [class.interactive]="interactive"
            [class.dimmed]="dimmed"
            [class.placed]="placed"
            [style.width.px]="sizePx"
            [style.height.px]="sizePx * 1.55"
            (click)="interactive && onCardClick($event)">

            <div class="card-face">
                <div class="word top">{{ getWord(0) }}</div>
                <div class="word right">{{ getWord(1) }}</div>
                <div class="word bottom">{{ getWord(2) }}</div>
                <div class="word left">{{ getWord(3) }}</div>
            </div>
        </div>
    `,
    styleUrls: ['./keyword-card-3d.component.scss']
})
export class KeywordCard3dComponent {
    @Input({ required: true }) card!: CloverCardModel;
    @Input() rotation = 0; // 0..3
    @Input() interactive = false;
    @Input() dimmed = false;
    @Input() placed = false;
    @Input() sizePx = 120;

    @Output() cardSelected = new EventEmitter<string>();

    onCardClick(_: MouseEvent) {
        this.cardSelected.emit(this.card.id);
    }

    getWord(edgeLocal: number): string {
        const words = this.card?.words ?? [];
        const r = ((this.rotation % 4) + 4) % 4;
        const idx = (edgeLocal + r) % 4;
        return words[idx] || '';
    }
}

