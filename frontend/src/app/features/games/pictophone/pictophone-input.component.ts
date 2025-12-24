import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../../services/signalr.service';

@Component({
    selector: 'app-pictophone-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="card shadow-sm h-100">
      <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
        
        <!-- Instruction -->
        <h3 class="mb-4">{{ getInstruction() }}</h3>

        <!-- Previous Content -->
        <div *ngIf="previousPage" class="mb-4 w-100" style="max-width: 500px;">
           <div *ngIf="previousPage.type === 'Drawing' || previousPage.type === 1" class="border rounded p-2 bg-light shadow-sm">
               <img [src]="previousPage.content" class="img-fluid rounded" alt="Drawing to guess">
           </div>
           <div *ngIf="previousPage.type === 'Text' || previousPage.type === 0" class="alert alert-secondary fs-4 shadow-sm">
               "{{ previousPage.content }}"
           </div>
        </div>

        <!-- Suggestions (Only for Prompting) -->
        <div *ngIf="phase === 'Prompting' && !isSubmitted" class="mb-4">
            <p class="text-muted small mb-2">Need an idea?</p>
            <div class="d-flex flex-wrap justify-content-center gap-2">
                <button *ngFor="let sug of suggestions" 
                        class="btn btn-sm btn-outline-info rounded-pill"
                        (click)="useSuggestion(sug)">
                   {{ sug }}
                </button>
                <button class="btn btn-sm btn-link text-info" (click)="loadSuggestions()" title="Refresh Suggestions">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>
        </div>

        <!-- Input Area -->
        <div *ngIf="!isSubmitted; else waitingTemplate" class="w-100" style="max-width: 500px;">
           <div class="input-group input-group-lg shadow-sm">
              <input type="text" class="form-control border-primary" [(ngModel)]="inputValue" 
                     (keyup.enter)="submit()"
                     (ngModelChange)="onInputChange()"
                     [placeholder]="getPlaceholder()"
                     autofocus>
              <button class="btn btn-primary px-4" (click)="submit()" [disabled]="!inputValue.trim()">
                 <i class="bi bi-send-fill me-2"></i> Submit
              </button>
           </div>
        </div>

        <ng-template #waitingTemplate>
            <div class="text-muted p-5">
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
                <h4 class="fw-bold">Ready!</h4>
                <p>Waiting for everyone else to finish...</p>
            </div>
        </ng-template>

      </div>
    </div>
  `
})
export class PictophoneInputComponent implements OnChanges {
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
