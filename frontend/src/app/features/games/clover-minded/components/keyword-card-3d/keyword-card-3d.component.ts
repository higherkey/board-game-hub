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

            <div class="card-face" [style.transform]="'rotate(' + (rotation * 90) + 'deg)'">
                <div class="word top">{{ words[0] }}</div>
                <div class="word right">{{ words[1] }}</div>
                <div class="word bottom">{{ words[2] }}</div>
                <div class="word left">{{ words[3] }}</div>
            </div>
            <ng-content></ng-content>
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

    get words(): string[] {
        return this.card?.words ?? ['', '', '', ''];
    }
}

