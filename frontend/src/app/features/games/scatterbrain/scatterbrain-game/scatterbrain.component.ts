import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, Room } from '../../../../services/signalr.service';
import { Observable, map, timer } from 'rxjs';

@Component({
    selector: 'app-scatterbrain',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './scatterbrain.component.html',
    styleUrls: ['./scatterbrain.component.scss']
})
export class ScatterbrainComponent implements OnInit, OnChanges {
    @Input() room!: Room;
    @Input() myConnectionId!: string;
    @Input() isHost: boolean = false;
    @Input() isHand: boolean = false;
    @Input() isScreen: boolean = false;
    @Input() isTable: boolean = false;

    timeLeft$: Observable<number>;
    answers: string[] = [];
    isSubmitting = false;

    constructor(private readonly signalRService: SignalRService) {
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
        // Table display setup
    }

    ngOnChanges(changes: SimpleChanges) {
        // Table display reacting to room state diffs
    }

    get phase(): 'Writing' | 'Validation' | 'Result' {
        const val = this.room?.gameData?.phase;
        if (val === 0 || val === 'Writing') return 'Writing';
        if (val === 1 || val === 'Validation') return 'Validation';
        if (val === 2 || val === 'Result') return 'Result';
        return 'Writing';
    }

    toggleVeto(targetPlayerId: string, categoryIndex: number) {
        if (!this.isHost || this.phase !== 'Validation') return;
        this.signalRService.sendGameAction('TOGGLE_VETO', { targetPlayerId, categoryIndex });
    }

    isVetoed(playerId: string, categoryIndex: number): boolean {
        const vetoes = this.room?.gameData?.vetoes?.[playerId];
        return vetoes ? vetoes.includes(categoryIndex) : false;
    }

    challengeWord(targetPlayerId: string, categoryIndex: number) {
        if (this.phase !== 'Validation') return;
        this.signalRService.sendGameAction('CHALLENGE_WORD', { targetPlayerId, categoryIndex });
    }

    voteChallenge(approve: boolean) {
        this.signalRService.sendGameAction('VOTE_WORD', { approve });
    }

    hasVoted(): boolean {
        return this.room?.gameData?.activeChallenge?.votes?.[this.myConnectionId] !== undefined;
    }

    nextPhase() {
        if (!this.isHost) return;
        // Don't allow proceeding if a challenge is active
        if (this.room?.gameData?.activeChallenge) return;

        if (this.phase === 'Result') {
            this.signalRService.startGame();
        } else {
            this.signalRService.sendGameAction('NEXT_PHASE', {});
        }
    }

    pauseGame() { this.signalRService.pauseGame(); }
    resumeGame() { this.signalRService.resumeGame(); }
    endRound() { this.nextPhase(); }

    get voteCount(): number {
        const votes = this.room?.gameData?.activeChallenge?.votes;
        return votes ? Object.keys(votes).length : 0;
    }

    get totalPlayers(): number {
        return this.room?.players?.length ?? 1;
    }

    get votePercentage(): number {
        return (this.voteCount / this.totalPlayers) * 100;
    }
}
