import { ComponentFixture, TestBed } from '@angular/core/testing';
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
});
