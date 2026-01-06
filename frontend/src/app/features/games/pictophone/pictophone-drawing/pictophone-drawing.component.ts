import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasDrawComponent } from '../../../../shared/components/canvas-draw/canvas-draw.component';

@Component({
    selector: 'app-pictophone-drawing',
    standalone: true,
    imports: [CommonModule, CanvasDrawComponent],
    templateUrl: './pictophone-drawing.component.html',
    styleUrls: ['./pictophone-drawing.component.scss']
})
export class PictophoneDrawingComponent implements OnChanges {
    @Input() prompt: string = '';
    @Input() timeLeft: number | null = null;
    @Output() imageSubmitted = new EventEmitter<string>();
    @Output() draftChanged = new EventEmitter<string>();

    currentImage: string | null = null;
    submitted: boolean = false;

    selectedColor: string = '#000000';
    selectedWidth: number = 3;

    colors: string[] = [
        '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
        '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'
    ];

    widths: number[] = [3, 8, 15, 30];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['timeLeft'] && this.timeLeft === 0 && !this.submitted) {
            this.autoSubmit();
        }
    }

    onImageGenerated(data: string) {
        this.currentImage = data;
        this.draftChanged.emit(data);
    }

    submit() {
        if (this.currentImage) {
            this.submitted = true;
            this.imageSubmitted.emit(this.currentImage);
        }
    }

    autoSubmit() {
        this.submitted = true;
        this.imageSubmitted.emit(this.currentImage || '');
    }
}
