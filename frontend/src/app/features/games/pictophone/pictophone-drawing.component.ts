import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasDrawComponent } from '../../../shared/components/canvas-draw/canvas-draw.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-pictophone-drawing',
    standalone: true,
    imports: [CommonModule, CanvasDrawComponent],
    template: `
    <div class="card shadow-sm h-100">
      <div class="card-body d-flex flex-column">
        
        <!-- Header / Prompt -->
        <div class="text-center mb-3">
            <h4 class="text-secondary mb-1">Draw this:</h4>
            <h2 class="display-6 fw-bold text-primary">{{ prompt }}</h2>
        </div>

        <!-- Canvas -->
        <div class="flex-grow-1 position-relative" style="min-height: 300px;">
           <ng-container *ngIf="!submitted; else waitingTemplate">
               <app-canvas-draw [height]="400" (imageGenerated)="onImageGenerated($event)"></app-canvas-draw>
               
               <div class="d-grid gap-2 mt-3">
                   <button class="btn btn-success btn-lg" (click)="submit()">
                       <i class="bi bi-check-lg"></i> Submit Drawing
                   </button>
               </div>
           </ng-container>
        </div>

        <ng-template #waitingTemplate>
            <div class="d-flex flex-column align-items-center justify-content-center h-100">
                <div class="spinner-border text-primary mb-2" role="status"></div>
                <p class="text-muted">Drawing submitted! Waiting for others...</p>
            </div>
        </ng-template>

      </div>
    </div>
  `
})
export class PictophoneDrawingComponent {
    @Input() prompt: string = '';
    @Output() imageSubmitted = new EventEmitter<string>();

    currentImage: string | null = null;
    submitted: boolean = false;

    constructor(private readonly toastService: ToastService) { }

    onImageGenerated(data: string) {
        this.currentImage = data;
    }

    submit() {
        if (this.currentImage) {
            this.submitted = true;
            this.imageSubmitted.emit(this.currentImage);
        } else {
            this.toastService.showWarning('Draw something first!');
        }
    }
}
