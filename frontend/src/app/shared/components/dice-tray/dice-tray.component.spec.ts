import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiceTrayComponent } from './dice-tray.component';
import { TrayDie, seedFrom } from './dice-math';

describe('DiceTrayComponent', () => {
    let fixture: ComponentFixture<DiceTrayComponent>;
    let el: HTMLElement;
    const dice: TrayDie[] = [
        { value: 1 }, { value: 5, selected: true }, { value: 3, held: true, locked: true }
    ];

    const create = async (inputs: Record<string, unknown>) => {
        await TestBed.configureTestingModule({ imports: [DiceTrayComponent] }).compileComponents();
        fixture = TestBed.createComponent(DiceTrayComponent);
        for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
        fixture.detectChanges();
        el = fixture.nativeElement;
    };

    it('draws still dice with readable labels when motion is off', async () => {
        await create({ dice, motion: 'none', selectable: true });
        const buttons = [...el.querySelectorAll<HTMLButtonElement>('.dt-die')];
        expect(buttons.length).toBe(3);
        expect(buttons.map(b => b.getAttribute('aria-label'))).toEqual(['Die 1, 1', 'Die 2, 5, picked', 'Die 3, 3, held']);
        expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
        expect(buttons[2].disabled).toBeTrue();
        expect(el.querySelectorAll('.dt-die circle').length).toBe(1 + 5 + 3);
    });

    it('reports taps, but not on locked dice', async () => {
        await create({ dice, motion: 'none', selectable: true });
        const taps: number[] = [];
        fixture.componentInstance.dieToggle.subscribe(i => taps.push(i));
        (fixture.componentInstance as any).toggle(0);
        (fixture.componentInstance as any).toggle(2);
        expect(taps).toEqual([0]);
    });

    it('shows text faces instead of pips when given', async () => {
        await create({ dice: [{ value: 2 }], motion: 'none', faces: ['A', 'B', 'C', 'D', 'E', 'F'] });
        expect(el.querySelector('.dt-face text')?.textContent).toBe('B');
        expect(el.querySelector('span.dt-die')).not.toBeNull(); // not selectable: no button
    });

    it('throws only when the roll id changes, never for the id it started with', async () => {
        await create({ dice, motion: 'none', rollId: 4 });
        const scene = jasmine.createSpyObj('DiceScene', ['show', 'throw', 'hotspots', 'setLook', 'dispose'], { isRolling: false });
        scene.hotspots.and.returnValue([]);
        (fixture.componentInstance as any).scene = scene;

        // Same roll id, new dice (say a die was picked): no throw.
        fixture.componentRef.setInput('dice', [...dice]);
        fixture.detectChanges();
        expect(scene.throw).not.toHaveBeenCalled();
        expect(scene.show).toHaveBeenCalled();

        fixture.componentRef.setInput('rollId', 5);
        fixture.detectChanges();
        expect(scene.throw).toHaveBeenCalledTimes(1);
        expect(scene.throw.calls.mostRecent().args[1]).toBe(seedFrom(5));
    });
});
