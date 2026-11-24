import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RulesDrawerComponent } from './rules-drawer.component';

@Component({
    standalone: true,
    imports: [RulesDrawerComponent],
    template: `<ng-template #rules><p class="rule">Roll three dice.</p></ng-template>
        <app-rules-drawer #drawer [rules]="rules"></app-rules-drawer>`
})
class HostComponent {
    @ViewChild('drawer', { static: true }) drawer!: RulesDrawerComponent;
    @ViewChild('rules', { static: true }) rules!: TemplateRef<unknown>;
}

describe('RulesDrawerComponent', () => {
    it('shows the game rules when opened and hides them when closed', () => {
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
        fixture.componentInstance.drawer.open();
        fixture.detectChanges();
        expect(dialog.open).toBeTrue();
        expect(dialog.querySelector('.rule')!.textContent).toContain('Roll three dice.');
        (dialog.querySelector('[aria-label="Close rules"]') as HTMLButtonElement).click();
        expect(dialog.open).toBeFalse();
    });
});
