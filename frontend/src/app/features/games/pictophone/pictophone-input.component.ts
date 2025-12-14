import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-pictophone-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="card shadow-sm h-100">
      <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
        
        <!-- Instruction -->
        <h3 class="mb-4">{{ getInstruction() }}</h3>

        <!-- Previous Content (Drawing or Text logic handled by parent passing 'previousPage') -->
        <div *ngIf="previousPage" class="mb-4 w-100" style="max-width: 500px;">
           <div *ngIf="previousPage.type === 'Drawing' || previousPage.type === 1" class="border rounded p-2 bg-light">
               <img [src]="previousPage.content" class="img-fluid" alt="Drawing to guess">
           </div>
           <div *ngIf="previousPage.type === 'Text' || previousPage.type === 0" class="alert alert-secondary fs-4">
               {{ previousPage.content }}
           </div>
        </div>

        <!-- Input Area -->
        <div *ngIf="!isSubmitted; else waitingTemplate" class="w-100" style="max-width: 400px;">
           <div class="input-group input-group-lg">
              <input type="text" class="form-control" [(ngModel)]="inputValue" 
                     (keyup.enter)="submit()"
                     [placeholder]="getPlaceholder()"
                     autofocus>
              <button class="btn btn-primary" (click)="submit()" [disabled]="!inputValue.trim()">
                 <i class="bi bi-send-fill"></i>
              </button>
           </div>
        </div>

        <ng-template #waitingTemplate>
            <div class="text-muted">
                <div class="spinner-border text-primary mb-2" role="status"></div>
                <p>Waiting for other players...</p>
            </div>
        </ng-template>

      </div>
    </div>
  `
})
export class PictophoneInputComponent {
    @Input() phase: string = '';
    @Input() previousPage: any;
    @Output() submitted = new EventEmitter<string>();

    inputValue: string = '';
    isSubmitted: boolean = false; // Local state to show spinner immediately

    getInstruction(): string {
        if (this.phase === 'Prompting') return 'Write a starting phrase!';
        if (this.phase === 'Guessing') return 'What is this drawing?';
        return '';
    }

    getPlaceholder(): string {
        return this.phase === 'Prompting' ? 'e.g. A flying toaster' : 'Your guess...';
    }

    submit() {
        if (this.inputValue.trim()) {
            this.isSubmitted = true;
            this.submitted.emit(this.inputValue.trim());
        }
    }
}
