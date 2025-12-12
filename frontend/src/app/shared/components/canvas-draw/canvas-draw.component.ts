import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-canvas-draw',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="canvas-wrapper border rounded bg-white position-relative" style="touch-action: none;">
      <canvas #canvas class="d-block w-100" [height]="height" style="cursor: crosshair"></canvas>
      
      <div class="tools position-absolute top-0 end-0 p-2">
         <button class="btn btn-sm btn-outline-danger" (click)="clear()">
            <i class="bi bi-trash"></i>
         </button>
      </div>
    </div>
  `,
    styles: [`
    .canvas-wrapper { overflow: hidden; }
  `]
})
export class CanvasDrawComponent implements AfterViewInit {
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    @Input() height = 300;
    @Output() imageGenerated = new EventEmitter<string>();

    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;
    private lastX = 0;
    private lastY = 0;

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        // Set actual width to match display width
        canvas.width = canvas.offsetWidth;

        this.ctx = canvas.getContext('2d')!;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#000000';

        // Mouse Events
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch Events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.startDrawing(mouseEvent);
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.draw(mouseEvent);
        });

        canvas.addEventListener('touchend', () => this.stopDrawing());
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
            this.emitImage();
        }
    }

    private getCoords(e: MouseEvent): [number, number] {
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
        this.emitImage();
    }

    private emitImage() {
        // Debounce? Or just emit on every stroke end?
        // Basic implementation: Export as Base64
        const data = this.canvasRef.nativeElement.toDataURL('image/png');
        this.imageGenerated.emit(data);
    }
}
