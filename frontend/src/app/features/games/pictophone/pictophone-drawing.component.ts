import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasDrawComponent } from '../../../shared/components/canvas-draw/canvas-draw.component';

@Component({
    selector: 'app-pictophone-drawing',
    standalone: true,
    imports: [CommonModule, CanvasDrawComponent],
    template: `
    <div class="card shadow-sm h-100 border-0 overflow-hidden bg-light">
      <div class="card-body d-flex flex-column p-0">
        
        <!-- Prompt Banner -->
        <div class="bg-primary text-white p-3 text-center shadow-sm z-index-10">
            <h5 class="text-white-50 text-uppercase small mb-1">Draw this:</h5>
            <h2 class="m-0 fw-black">{{ prompt }}</h2>
        </div>

        <!-- Canvas Area -->
        <div class="flex-grow-1 position-relative bg-white d-flex flex-column" style="min-height: 400px;">
           <ng-container *ngIf="!submitted; else waitingTemplate">
               
               <!-- PALETTE -->
               <div class="palette-bar p-2 bg-white border-bottom d-flex align-items-center gap-3 overflow-auto shadow-sm">
                   <div class="d-flex gap-1 p-1 bg-light rounded border">
                       <div *ngFor="let c of colors" 
                            class="color-swatch rounded-circle cursor-pointer border shadow-sm"
                            [style.background-color]="c"
                            [class.selected]="selectedColor === c"
                            (click)="selectedColor = c">
                       </div>
                   </div>
                   
                   <div class="vr"></div>

                   <div class="d-flex gap-2">
                       <button *ngFor="let w of widths" 
                               class="btn btn-sm"
                               [class.btn-primary]="selectedWidth === w"
                               [class.btn-outline-secondary]="selectedWidth !== w"
                               (click)="selectedWidth = w"
                               title="Brush Size">
                           <div class="bg-dark rounded-circle mx-auto" 
                                [style.width.px]="w/2 + 2" 
                                [style.height.px]="w/2 + 2"></div>
                       </button>
                   </div>
               </div>

               <app-canvas-draw 
                  class="flex-grow-1"
                  [height]="500" 
                  [color]="selectedColor"
                  [lineWidth]="selectedWidth"
                  (imageGenerated)="onImageGenerated($event)">
               </app-canvas-draw>
               
               <div class="canvas-controls p-3 bg-white border-top d-flex justify-content-center shadow-sm">
                   <button class="btn btn-success btn-lg px-5 fw-bold rounded-pill shadow" (click)="submit()" [disabled]="!currentImage">
                       <i class="bi bi-check-lg me-2"></i> I'm Done!
                   </button>
               </div>
           </ng-container>
        </div>

        <ng-template #waitingTemplate>
            <div class="d-flex flex-column align-items-center justify-content-center h-100 bg-light p-5">
                <div class="spinner-grow text-primary mb-4" style="width: 4rem; height: 4rem;" role="status"></div>
                <h3 class="fw-bold text-primary">Masterpiece!</h3>
                <p class="text-muted fs-5">Drawing submitted. Waiting for markers to be put down...</p>
            </div>
        </ng-template>

      </div>
    </div>
  `,
    styles: [`
    .z-index-10 { z-index: 10; }
    .fw-black { font-weight: 900; }
    .color-swatch { 
        width: 28px; 
        height: 28px; 
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .color-swatch:hover { transform: scale(1.1); }
    .color-swatch.selected { 
        border: 3px solid #000 !important; 
        transform: scale(1.2); 
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .cursor-pointer { cursor: pointer; }
    .palette-bar { z-index: 5; }
  `]
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
