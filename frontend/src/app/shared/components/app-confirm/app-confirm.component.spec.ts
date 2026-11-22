import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppConfirmComponent } from './app-confirm.component';
import { ConfirmService } from '../../services/confirm.service';

describe('AppConfirmComponent', () => {
    let fixture: ComponentFixture<AppConfirmComponent>;
    let service: ConfirmService;
    let dialog: HTMLDialogElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [AppConfirmComponent] }).compileComponents();
        fixture = TestBed.createComponent(AppConfirmComponent);
        document.body.appendChild(fixture.nativeElement);
        fixture.detectChanges();
        service = TestBed.inject(ConfirmService);
        dialog = fixture.nativeElement.querySelector('dialog');
    });

    afterEach(() => {
        if (dialog.open) dialog.close();
        fixture.nativeElement.remove();
    });

    const ask = () => {
        const answer = service.confirm({ title: 'End the game?', message: 'Scores are final.', confirmLabel: 'End game' });
        fixture.detectChanges();
        return answer;
    };
    const button = (text: string) => [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === text)!;

    it('opens as a modal with the title and message, and resolves true on confirm', async () => {
        const answer = ask();
        expect(dialog.open).toBeTrue();
        expect(dialog.querySelector('h2')?.textContent).toBe('End the game?');
        expect(dialog.textContent).toContain('Scores are final.');
        button('End game').click();
        expect(await answer).toBeTrue();
        expect(dialog.open).toBeFalse();
    });

    it('resolves false on cancel, on Escape, and on a backdrop click', async () => {
        let answer = ask();
        button('Cancel').click();
        expect(await answer).toBeFalse();

        answer = ask();
        dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
        expect(await answer).toBeFalse();

        answer = ask();
        dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(await answer).toBeFalse();
        expect(dialog.open).toBeFalse();
    });
});
