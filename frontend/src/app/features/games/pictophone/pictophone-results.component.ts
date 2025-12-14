import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pictophone-results',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-100 d-flex flex-column align-items-center overflow-hidden">
        
        <!-- Controls -->
        <div class="d-flex gap-3 mb-3">
            <button class="btn btn-outline-secondary" (click)="prevBook()" [disabled]="currentBookIndex === 0">
                <i class="bi bi-chevron-left"></i> Previous Book
            </button>
            <span class="fs-4 fw-bold">Book {{ currentBookIndex + 1 }} of {{ books.length }}</span>
            <button class="btn btn-outline-secondary" (click)="nextBook()" [disabled]="currentBookIndex === books.length - 1">
                Next Book <i class="bi bi-chevron-right"></i>
            </button>
        </div>

        <!-- Book Content (Scrollable Timeline) -->
        <div class="flex-grow-1 w-100 overflow-auto px-4 pb-4" *ngIf="books[currentBookIndex] as book">
            <div class="container" style="max-width: 800px;">
                
                <!-- Pages -->
                <div *ngFor="let page of book.pages; let i = index" class="card mb-4 shadow-sm">
                    <div class="card-header d-flex justify-content-between">
                         <span>Step {{ i + 1 }}</span>
                         <!-- Future: Show Author Name if we map ID to Name -->
                    </div>
                    <div class="card-body text-center">
                        <!-- Text -->
                        <div *ngIf="page.type === 'Text' || page.type === 0">
                            <h3 class="display-6">{{ page.content }}</h3>
                        </div>

                        <!-- Drawing -->
                        <div *ngIf="page.type === 'Drawing' || page.type === 1">
                             <img [src]="page.content" class="img-fluid border rounded" alt="Drawing">
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>
  `
})
export class PictophoneResultsComponent {
    @Input() books: any[] = [];
    currentBookIndex = 0;

    nextBook() {
        if (this.currentBookIndex < this.books.length - 1) {
            this.currentBookIndex++;
        }
    }

    prevBook() {
        if (this.currentBookIndex > 0) {
            this.currentBookIndex--;
        }
    }
}
