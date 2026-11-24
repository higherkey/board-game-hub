import { ChangeDetectionStrategy, Component, ElementRef, Input, TemplateRef, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** The active game's rules in a side sheet, opened from the game bar or the game menu. */
@Component({
    selector: 'app-rules-drawer',
    standalone: true,
    imports: [NgTemplateOutlet],
    templateUrl: './rules-drawer.component.html',
    styleUrls: ['./rules-drawer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulesDrawerComponent {
    @Input() rules: TemplateRef<unknown> | null = null;
    @ViewChild('dialog', { static: true }) private readonly dialog!: ElementRef<HTMLDialogElement>;

    open(): void {
        if (!this.dialog.nativeElement.open) this.dialog.nativeElement.showModal();
    }

    close(): void {
        if (this.dialog.nativeElement.open) this.dialog.nativeElement.close();
    }

    /** A click on the backdrop lands on the dialog element itself. */
    protected backdrop(event: MouseEvent): void {
        if (event.target === this.dialog.nativeElement) this.close();
    }
}
