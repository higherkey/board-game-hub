import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-canvas-draw',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './canvas-draw.component.html',
    styleUrls: ['./canvas-draw.component.scss']
})
export class CanvasDrawComponent implements AfterViewInit, OnChanges {
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    @Input() height = 400;
    @Input() color = '#000000';
    @Input() lineWidth = 3;
    @Output() imageGenerated = new EventEmitter<string>();

    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;
    private lastX = 0;
    private lastY = 0;

    undoStack: string[] = [];

    ngAfterViewInit() {
        this.initCanvas();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.ctx) {
            if (changes['color']) this.ctx.strokeStyle = this.color;
            if (changes['lineWidth']) this.ctx.lineWidth = this.lineWidth;
        }
    }

    private initCanvas() {
        const canvas = this.canvasRef.nativeElement;
        canvas.width = canvas.offsetWidth;

        this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.color;

        // Fill white background initially
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.saveToUndoStack();

        // Mouse Events
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch Events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing(this.createMouseEvent('mousedown', touch));
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw(this.createMouseEvent('mousemove', touch));
        });

        canvas.addEventListener('touchend', () => this.stopDrawing());
    }

    private createMouseEvent(type: string, touch: Touch): MouseEvent {
        return new MouseEvent(type, {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    private startDrawing(e: MouseEvent) {
        this.isDrawing = true;
        [this.lastX, this.lastY] = this.getCoords(e);
    }

    private draw(e: MouseEvent) {
        if (!this.isDrawing) return;
        const [x, y] = this.getCoords(e);

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        [this.lastX, this.lastY] = [x, y];
    }

    private stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveToUndoStack();
            this.emitImage();
        }
    }

    private getCoords(e: MouseEvent): [number, number] {
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        const scaleX = this.canvasRef.nativeElement.width / rect.width;
        const scaleY = this.canvasRef.nativeElement.height / rect.height;
        return [
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top) * scaleY
        ];
    }

    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
        this.saveToUndoStack();
        this.emitImage();
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.undoStack.pop(); // Remove current state
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.loadFromDataUrl(previousState);
        }
    }

    private saveToUndoStack() {
        const data = this.canvasRef.nativeElement.toDataURL();
        this.undoStack.push(data);
        if (this.undoStack.length > 20) this.undoStack.shift();
    }

    private loadFromDataUrl(dataUrl: string) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
            this.ctx.drawImage(img, 0, 0);
            this.emitImage();
        };
        img.src = dataUrl;
    }

    private emitImage() {
        const data = this.canvasRef.nativeElement.toDataURL('image/png');
        this.imageGenerated.emit(data);
    }
}
