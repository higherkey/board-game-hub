import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { GameDefinition } from '../../../../services/game-data.service';

@Component({
    selector: 'app-game-combobox',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './game-combobox.component.html',
    styleUrl: './game-combobox.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => GameComboboxComponent),
            multi: true
        }
    ]
})
export class GameComboboxComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
    @Input() options: GameDefinition[] = [];
    @Input() disabled = false;
    @Input() placeholder = 'Select a game...';
    @Input() idPrefix = 'game-cb';
    @Output() selectionChange = new EventEmitter<string>();

    @ViewChild('inputEle') inputEle!: ElementRef<HTMLInputElement>;
    @ViewChild('buttonEle') buttonEle!: ElementRef<HTMLButtonElement>;
    @ViewChild('listboxEle') listboxEle!: ElementRef<HTMLUListElement>;

    value: string = '';
    filter: string = '';
    isOpen = false;
    filteredOptions: GameDefinition[] = [];
    activeIndex = -1;
    hasVisualFocus = false;
    listboxHasFocus = false;

    private onTouch: any = () => { };
    private onChange: any = () => { };

    constructor() { }

    ngAfterViewInit() {
        this.filterOptions();
        document.addEventListener('pointerup', this.onBackgroundClick);
    }

    ngOnDestroy() {
        document.removeEventListener('pointerup', this.onBackgroundClick);
    }

    // ControlValueAccessor implementation
    writeValue(value: string): void {
        this.value = value || '';
        if (this.value === 'None' || !this.value) {
            this.filter = '';
        } else {
            // Find the name if value is ID
            const game = this.options.find(g => g.id === this.value);
            this.filter = game ? game.name : this.value;
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouch = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // Logic
    filterOptions() {
        const search = this.filter.toLowerCase();
        this.filteredOptions = this.options.filter(o =>
            o.name.toLowerCase().includes(search)
        );

        // Reset active index if it's out of bounds
        if (this.activeIndex >= this.filteredOptions.length) {
            this.activeIndex = -1;
        }
    }

    onInput(event: Event) {
        const val = (event.target as HTMLInputElement).value;
        this.filter = val;
        this.filterOptions();
        if (!this.isOpen && this.filter) {
            this.open();
        }
        this.activeIndex = -1;
    }

    onKeyDown(event: KeyboardEvent) {
        if (this.disabled) return;

        switch (event.key) {
            case 'Enter':
                if (this.isOpen && this.activeIndex >= 0) {
                    this.selectOption(this.filteredOptions[this.activeIndex]);
                }
                this.close();
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.open();
                this.activeIndex = (this.activeIndex + 1) % this.filteredOptions.length;
                this.scrollToActive();
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.open();
                this.activeIndex = (this.activeIndex - 1 + this.filteredOptions.length) % this.filteredOptions.length;
                this.scrollToActive();
                event.preventDefault();
                break;
            case 'Escape':
                this.close();
                event.preventDefault();
                break;
            case 'Tab':
                this.close();
                break;
        }
    }

    open() {
        if (this.disabled) return;
        this.isOpen = true;
        this.filterOptions();
    }

    close() {
        this.isOpen = false;
        this.activeIndex = -1;
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
        this.inputEle.nativeElement.focus();
    }

    selectOption(option: GameDefinition) {
        this.value = option.id;
        this.filter = option.name;
        this.onChange(this.value);
        this.selectionChange.emit(this.value);
        this.close();
    }

    clearSelection(event?: MouseEvent) {
        if (event) {
            event.stopPropagation();
        }
        this.value = 'None';
        this.filter = '';
        this.onChange(this.value);
        this.selectionChange.emit(this.value);
        this.filterOptions();
    }

    onFocus() {
        this.hasVisualFocus = true;
    }

    onBlur() {
        this.hasVisualFocus = false;
        this.onTouch();
    }

    onBackgroundClick = (event: PointerEvent) => {
        const target = event.target as HTMLElement;
        if (!this.inputEle.nativeElement.contains(target) &&
            !this.buttonEle.nativeElement.contains(target) &&
            (!this.listboxEle || !this.listboxEle.nativeElement.contains(target))) {
            this.close();
        }
    }

    private scrollToActive() {
        setTimeout(() => {
            const activeEl = this.listboxEle?.nativeElement.querySelector('[aria-selected="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        });
    }
}
