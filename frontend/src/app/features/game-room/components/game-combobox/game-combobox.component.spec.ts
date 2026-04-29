import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { GameComboboxComponent } from './game-combobox.component';
import { GameDefinition } from '../../../../services/game-data.service';

describe('GameComboboxComponent', () => {
    let component: GameComboboxComponent;
    let fixture: ComponentFixture<GameComboboxComponent>;
    
    const mockOptions: GameDefinition[] = [
        { id: '1', name: 'Game One' } as any as GameDefinition,
        { id: '2', name: 'Game Two' } as any as GameDefinition
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameComboboxComponent, FormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(GameComboboxComponent);
        component = fixture.componentInstance;
        component.options = mockOptions;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should write value and set filter string', () => {
        component.writeValue('1');
        expect(component.value).toBe('1');
        expect(component.filter).toBe('Game One');
    });

    it('should handle written None value', () => {
        component.writeValue('None');
        expect(component.value).toBe('None');
        expect(component.filter).toBe('');
    });

    it('should filter options based on input', () => {
        component.filter = 'two';
        component.filterOptions();
        expect(component.filteredOptions.length).toBe(1);
        expect(component.filteredOptions[0].id).toBe('2');
    });

    it('should open and close the dropdown', () => {
        component.open();
        expect(component.isOpen).toBeTrue();
        component.close();
        expect(component.isOpen).toBeFalse();
    });

    it('should handle selectOption correctly', () => {
        spyOn(component.selectionChange, 'emit');
        component.selectOption(mockOptions[0]);
        
        expect(component.value).toBe('1');
        expect(component.filter).toBe('Game One');
        expect(component.selectionChange.emit).toHaveBeenCalledWith('1');
        expect(component.isOpen).toBeFalse();
    });

    describe('Keyboard Events', () => {
        it('should handle ArrowDown to open and navigate', () => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            component.onKeyDown(event);
            expect(component.isOpen).toBeTrue();
            expect(component.activeIndex).toBe(0);
            
            component.onKeyDown(event);
            expect(component.activeIndex).toBe(1);
        });

        it('should handle ArrowUp to navigate', () => {
            component.isOpen = true;
            component.activeIndex = 0;
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            component.onKeyDown(event);
            expect(component.activeIndex).toBe(1); // wraps around
        });

        it('should handle Escape to close', () => {
            component.isOpen = true;
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            component.onKeyDown(event);
            expect(component.isOpen).toBeFalse();
        });

        it('should handle Enter to select', () => {
            spyOn(component, 'selectOption');
            component.isOpen = true;
            component.activeIndex = 1;
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            component.onKeyDown(event);
            expect(component.selectOption).toHaveBeenCalledWith(mockOptions[1]);
        });
    });

    it('should handle background click to close', () => {
        component.isOpen = true;
        fixture.detectChanges();
        
        // Mock a click on document body
        const event = { target: document.body } as any as PointerEvent;
        component.onBackgroundClick(event);
        
        expect(component.isOpen).toBeFalse();
    });

    it('should handle clearSelection correctly', () => {
        component.value = '1';
        component.filter = 'Game One';
        spyOn(component.selectionChange, 'emit');
        
        component.clearSelection();
        
        expect(component.value).toBe('None');
        expect(component.filter).toBe('');
        expect(component.selectionChange.emit).toHaveBeenCalledWith('None');
    });
});
