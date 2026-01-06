import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../../../services/signalr.service';

@Component({
    selector: 'app-pictophone-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pictophone-input.component.html',
    styleUrls: ['./pictophone-input.component.scss']
})
export class PictophoneInputComponent implements OnChanges, OnInit {
    @Input() phase: string = '';
    @Input() previousPage: any;
    @Input() timeLeft: number | null = null;

    @Output() submitted = new EventEmitter<string>();
    @Output() draftChanged = new EventEmitter<string>();

    inputValue: string = '';
    isSubmitted: boolean = false;
    suggestions: string[] = [];

    constructor(private readonly signalR: SignalRService) { }

    ngOnInit() {
        if (this.phase === 'Prompting') {
            this.loadSuggestions();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['timeLeft'] && this.timeLeft === 0 && !this.isSubmitted) {
            this.autoSubmit();
        }
    }

    getInstruction(): string {
        if (this.phase === 'Prompting') return 'Write a starting phrase!';
        if (this.phase === 'Guessing') return 'What do you see in this drawing?';
        return '';
    }

    getPlaceholder(): string {
        return this.phase === 'Prompting' ? 'e.g. A flying toaster' : 'Your guess...';
    }

    onInputChange() {
        this.draftChanged.emit(this.inputValue);
    }

    async loadSuggestions() {
        this.suggestions = await this.signalR.getPictophoneSuggestions();
    }

    useSuggestion(sug: string) {
        this.inputValue = sug;
        this.onInputChange();
    }

    submit() {
        const val = this.inputValue.trim();
        if (val) {
            this.isSubmitted = true;
            this.submitted.emit(val);
        }
    }

    autoSubmit() {
        // If empty, use a placeholder or the draft
        const val = this.inputValue.trim() || "(Time ran out!)";
        this.isSubmitted = true;
        this.submitted.emit(val);
    }
}
