import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { ConfirmService, ConfirmOptions } from '../../services/confirm.service';

/**
 * The site's confirm dialog. Mounted once in the layout; ConfirmService opens it and waits for the answer.
 * A real modal <dialog>: focus stays inside, Escape and the backdrop cancel. A bottom sheet on phones.
 */
@Component({
    selector: 'app-confirm',
    standalone: true,
    templateUrl: './app-confirm.component.html',
    styleUrls: ['./app-confirm.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppConfirmComponent {
    @ViewChild('confirmDialog', { static: true }) private readonly dialog!: ElementRef<HTMLDialogElement>;
    protected readonly options = signal<ConfirmOptions | null>(null);

    constructor(private readonly confirmService: ConfirmService) {
        this.confirmService.register(this);
    }

    show(options: ConfirmOptions): void {
        this.options.set(options);
        this.dialog.nativeElement.showModal();
    }

    protected answer(result: boolean): void {
        if (!this.options()) return;
        this.options.set(null);
        if (this.dialog.nativeElement.open) this.dialog.nativeElement.close();
        this.confirmService.resolve(result);
    }

    /** A click on the backdrop lands on the dialog element itself, outside its content. */
    protected backdropClick(event: MouseEvent): void {
        if (event.target === this.dialog.nativeElement) this.answer(false);
    }
}
