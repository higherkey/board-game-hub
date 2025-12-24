import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pictophone-results',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-100 d-flex flex-column overflow-hidden bg-surface-3 py-4">
        
        <!-- Header Info -->
        <div class="text-center mb-4">
            <h1 class="display-4 fw-black text-primary mb-1">THE STORY SO FAR</h1>
            <p class="text-muted fs-5">Revealing Book {{ showcaseBookIndex + 1 }} of {{ books.length }}</p>
        </div>

        <!-- REVEAL STAGE -->
        <div class="flex-grow-1 position-relative d-flex align-items-center justify-content-center px-3">
            <div class="reveal-container w-100 h-100 d-flex flex-column align-items-center justify-content-center" style="max-width: 900px;">
                
                <!-- THE CURRENT PAGE -->
                <div *ngIf="getCurrentPage() as page" class="reveal-card card shadow-lg border-0 w-100" [class.page-enter]="true">
                    <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center p-3">
                        <div class="d-flex align-items-center gap-2">
                            <div class="avatar bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <span class="fw-bold">Step {{ showcasePageIndex + 1 }}</span>
                        </div>
                        <div class="badge bg-light text-dark border">
                            {{ page.type === 'Text' || page.type === 0 ? 'WRITTEN' : 'DRAWN' }}
                        </div>
                    </div>
                    
                    <div class="card-body p-5 text-center d-flex flex-column align-items-center justify-content-center" style="min-height: 400px;">
                        <!-- Text Page -->
                        <div *ngIf="page.type === 'Text' || page.type === 0" class="text-content">
                            <h2 class="display-1 fw-black text-dark mb-0 line-height-tight">"{{ page.content }}"</h2>
                        </div>

                        <!-- Drawing Page -->
                        <div *ngIf="page.type === 'Drawing' || page.type === 1" class="drawing-content w-100">
                             <img [src]="page.content" class="img-fluid border rounded-4 shadow-sm" alt="Drawing" style="max-height: 60vh;">
                        </div>
                    </div>

                    <div class="card-footer bg-white border-0 p-3 d-flex justify-content-between align-items-center">
                         <div class="text-muted small">
                            {{ showcasePageIndex > 0 ? 'Wait for it...' : 'The beginning of the story.' }}
                         </div>
                         
                         <!-- STAR BUTTON -->
                         <div class="d-flex align-items-center gap-2">
                             <div *ngIf="getCurrentPage()?.stars?.length" class="star-count-badge badge rounded-pill bg-warning text-dark border shadow-sm px-3 py-2">
                                 <i class="bi bi-star-fill me-1"></i> {{ getCurrentPage()?.stars?.length }}
                             </div>
                             <button class="btn btn-star btn-lg rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm"
                                     [class.starred]="hasStarred()"
                                     [disabled]="hasStarred()"
                                     (click)="toggleStar()"
                                     title="Star this page!">
                                 <i class="bi" [class.bi-star]="!hasStarred()" [class.bi-star-fill]="hasStarred()"></i>
                             </button>
                         </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- HOST CONTROLS -->
        <div class="p-4 d-flex justify-content-center gap-3 mt-auto">
            <div *ngIf="isHost" class="host-panel p-3 bg-white rounded-pill shadow-lg border d-flex gap-2 align-items-center">
                <span class="px-3 fw-bold text-primary small border-end me-2">ADVENTURE GUIDE</span>
                <button class="btn btn-primary btn-lg rounded-pill px-5 fw-bold reveal-next-btn shadow" 
                        (click)="nextReveal()">
                    REVEAL NEXT <i class="bi bi-stars ms-2"></i>
                </button>
            </div>
            <div *ngIf="!isHost" class="p-4">
                <div class="p-3 bg-white rounded-pill shadow-sm border text-muted px-4">
                    <i class="bi bi-info-circle me-2"></i> Only the host can turn the page...
                </div>
            </div>
        </div>

    </div>
  `,
    styles: [`
    .fw-black { font-weight: 900; }
    .bg-surface-3 { background-color: #f8f9fa; }
    .reveal-card {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(0);
        opacity: 1;
    }
    .page-enter {
        animation: slideIn 0.5s ease-out;
    }
    @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .line-height-tight { line-height: 1.1; }
    .reveal-next-btn:active { transform: scale(0.95); }
    
    .btn-star {
        width: 48px;
        height: 48px;
        background: #fff;
        border: 2px solid #ffc107;
        color: #ffc107;
        transition: all 0.2s ease;
    }
    .btn-star:hover:not(:disabled) {
        background: #fff3cd;
        transform: scale(1.1) rotate(5deg);
    }
    .btn-star.starred {
        background: #ffc107;
        color: #fff;
        border-color: #ffc107;
        animation: burst 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes burst {
        0% { transform: scale(1); }
        50% { transform: scale(1.4); }
        100% { transform: scale(1); }
    }
    .star-count-badge {
        animation: slideInRight 0.3s ease-out;
    }
    @keyframes slideInRight {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class PictophoneResultsComponent {
    @Input() books: any[] = [];
    @Input() isHost: boolean = false;
    @Input() showcaseBookIndex: number = 0;
    @Input() showcasePageIndex: number = 0;
    @Input() myConnectionId: string = '';

    @Output() revealNext = new EventEmitter<void>();
    @Output() starPage = new EventEmitter<{ bookIndex: number, pageIndex: number }>();

    getCurrentPage() {
        if (this.showcaseBookIndex < 0 || this.showcaseBookIndex >= this.books.length) return null;
        const book = this.books[this.showcaseBookIndex];
        if (this.showcasePageIndex < 0 || this.showcasePageIndex >= book.pages.length) return null;
        return book.pages[this.showcasePageIndex];
    }

    hasStarred(): boolean {
        const page = this.getCurrentPage();
        return page?.stars?.includes(this.myConnectionId) || false;
    }

    nextReveal() {
        this.revealNext.emit();
    }

    toggleStar() {
        if (!this.hasStarred()) {
            this.starPage.emit({
                bookIndex: this.showcaseBookIndex,
                pageIndex: this.showcasePageIndex
            });
        }
    }
}
