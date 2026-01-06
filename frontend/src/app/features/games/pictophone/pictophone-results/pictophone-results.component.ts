import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pictophone-results',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pictophone-results.component.html',
    styleUrls: ['./pictophone-results.component.scss']
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
