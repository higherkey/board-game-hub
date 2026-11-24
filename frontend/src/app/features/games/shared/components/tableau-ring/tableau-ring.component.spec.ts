import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableauRingComponent } from './tableau-ring.component';

describe('TableauRingComponent', () => {
    let fixture: ComponentFixture<TableauRingComponent>;
    let el: HTMLElement;

    beforeEach(() => {
        fixture = TestBed.createComponent(TableauRingComponent);
        el = fixture.nativeElement;
        fixture.componentRef.setInput('entries', [
            { id: 'a', name: 'Ann', score: 120, isMe: true },
            { id: 'b', name: 'Bo', score: 90, active: true }
        ]);
        fixture.detectChanges();
    });

    it('lists each player with a score, marking the active player and me', () => {
        const rows = el.querySelectorAll('li');
        expect(rows.length).toBe(2);
        expect(rows[0].textContent).toContain('Ann');
        expect(rows[0].textContent).toContain('(you)');
        expect(rows[0].textContent).toContain('120');
        expect(rows[0].getAttribute('aria-current')).toBeNull();
        expect(rows[1].getAttribute('aria-current')).toBe('true');
    });

    it('names the list with its label', () => {
        expect(el.querySelector('ul')!.getAttribute('aria-label')).toBe('Scores');
    });
});
