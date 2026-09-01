import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, Room } from '../../../../services/signalr.service';
import { Observable, map, timer } from 'rxjs';

@Component({
    selector: 'app-scatterbrain-hand',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './scatterbrain-hand.component.html',
    styleUrls: ['./scatterbrain-hand.component.scss']
})
export class ScatterbrainHandComponent implements OnInit, OnChanges {
    @Input() room?: Room;
    @Input() myConnectionId: string = '';
    @Input() isHost: boolean = false;
    @Input() isHand: boolean = true;
    @Input() set playerId(v: string) {
        if (v) this.myConnectionId = v;
    }

    private readonly signalRService = inject(SignalRService);

    timeLeft$: Observable<number>;
    answers: string[] = [];
    isSubmitting = false;

    constructor() {
        this.timeLeft$ = timer(0, 1000).pipe(
            map(() => {
                if (!this.room?.roundEndTime || this.room.isPaused) return 0;
                const end = new Date(this.room.roundEndTime).getTime();
                const now = Date.now();
                return Math.max(0, Math.ceil((end - now) / 1000));
            })
        );
    }

    ngOnInit() {
        this.initAnswers();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['room']) {
            const prev = changes['room'].previousValue;
            const curr = changes['room'].currentValue;

            if (curr?.roundNumber !== prev?.roundNumber ||
                curr?.gameData?.categories?.length !== prev?.gameData?.categories?.length) {
                this.initAnswers();
            }
        }
    }

    get phase(): 'Writing' | 'Validation' | 'Result' {
        const val = this.room?.gameData?.phase;
        if (val === 0 || val === 'Writing') return 'Writing';
        if (val === 1 || val === 'Validation') return 'Validation';
        if (val === 2 || val === 'Result') return 'Result';
        return 'Writing';
    }

    initAnswers() {
        const categories = this.room?.gameData?.categories || [];
        const existingAnswers = this.room?.playerAnswers?.[this.myConnectionId];

        if (existingAnswers && existingAnswers.length === categories.length) {
            this.answers = [...existingAnswers];
        } else {
            this.answers = new Array(categories.length).fill('');
        }
    }

    submitAnswers() {
        if (this.phase !== 'Writing' || this.isSubmitting) return;
        this.isSubmitting = true;
        try {
            const cleanAnswers = this.answers.map(a => a ? a.trim() : '');
            this.signalRService.submitAnswers(cleanAnswers);
        } finally {
            this.isSubmitting = false;
        }
    }

    voteChallenge(approve: boolean) {
        this.signalRService.sendGameAction('VOTE_WORD', { approve });
    }

    hasVoted(): boolean {
        const activeChallenge = this.room?.gameData?.activeChallenge;
        if (!activeChallenge?.votes) return false;
        return activeChallenge.votes[this.myConnectionId] !== undefined;
    }

    pauseGame() {
        this.signalRService.pauseGame();
    }

    resumeGame() {
        this.signalRService.resumeGame();
    }

    endRound() {
        this.signalRService.endRound();
    }
}
