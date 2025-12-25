import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasDrawComponent } from '../../../shared/components/canvas-draw/canvas-draw.component';

@Component({
    selector: 'app-one-and-only-player',
    standalone: true,
    imports: [CommonModule, FormsModule, CanvasDrawComponent],
    templateUrl: './one-and-only-player.component.html',
    styleUrls: ['./one-and-only-player.component.scss']
})
export class OneAndOnlyPlayerComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
    @Output() clueSubmitted = new EventEmitter<string>();
    @Output() guessSubmitted = new EventEmitter<{ guess: string, isPass: boolean }>();

    guess: string = '';
    currentImage: string | null = null;

    get gameData() { return this.room?.gameData; }

    get isGuesser(): boolean {
        return this.myConnectionId === this.gameData?.guesserId;
    }

    submitClue() {
        if (this.currentImage) {
            this.clueSubmitted.emit(this.currentImage);
        }
    }

    sendGuess() {
        if (this.guess) {
            this.guessSubmitted.emit({ guess: this.guess, isPass: false });
        }
    }

    sendPass() {
        this.guessSubmitted.emit({ guess: '', isPass: true });
    }
}
