import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../services/signalr.service';
import { UniversalTranslatorRulesComponent } from './components/universal-translator-rules.component';

@Component({
    selector: 'app-universal-translator',
    standalone: true,
    imports: [CommonModule, UniversalTranslatorRulesComponent],
    templateUrl: './universal-translator.component.html',
    styleUrls: ['./universal-translator.component.scss']
})
export class UniversalTranslatorComponent implements OnChanges {
    @Input() room!: Room;

    gameState: any;
    myRole: string = 'Loading...';
    myTargetWord: string | null = null;
    timerDisplay: string = '00:00';
    private timerInterval: any;

    showRules = false;
    myVote: string | null = null;

    constructor(
        private readonly signalR: SignalRService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['room'] && this.room) {
            this.gameState = this.room.gameData;
            this.updateMyRole();
            this.updateTimer();
        }
    }

    get isMainComputer(): boolean {
        return this.myRole === 'MainComputer';
    }

    get isJ(): boolean {
        return this.myRole === 'J';
    }

    get otherPlayers(): any[] {
        // Exclude self
        const myId = this.signalR.getConnectionId();
        return this.room.players.filter(p => p.connectionId !== myId);
    }

    updateMyRole() {
        if (!this.gameState?.roles) return;
        const myId = this.signalR.getConnectionId() || '';
        const role = this.gameState.roles[myId];
        this.myRole = role || 'Spectator';

        // Visible Word logic
        // MC, J, Empath see the word. Crew does not.
        if (['MainComputer', 'J', 'Empath'].includes(role)) {
            this.myTargetWord = this.gameState.targetWord;
        } else {
            this.myTargetWord = null;
        }
    }

    updateTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const end = this.room.roundEndTime ? new Date(this.room.roundEndTime).getTime() : 0;

        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const diff = Math.max(0, end - now);

            if (diff <= 0) {
                this.timerDisplay = "00:00";
                clearInterval(this.timerInterval);
                // If Phase is DAY and time expired, maybe auto-trigger vote if not handled by backend?
                // Frontend can trigger "ForcePhase" if needed, but safer to let backend handle it or 
                // call "EndRound". 
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                this.timerDisplay = `${m}:${s < 10 ? '0' + s : s}`;
            }
        }, 1000);
    }

    sendToken(token: string) {
        if (!this.isMainComputer) return;
        this.signalR.submitUniversalTranslatorToken(token);
    }

    pickWord(word: string) {
        if (!this.isMainComputer) return;
        this.signalR.pickUniversalTranslatorWord(word);
    }

    vote(targetId: string) {
        this.myVote = targetId;
        this.signalR.submitUniversalTranslatorVote(targetId);
    }

    getTokenRemaining(token: string): number {
        return this.gameState?.tokenLimits?.[token] ?? 0;
    }

    getTokenClass(token: string): string {
        switch (token) {
            case 'Yes': return 'text-green-400';
            case 'No': return 'text-red-400';
            case 'Maybe': return 'text-yellow-400';
            case 'So Close': return 'text-purple-400';
            case 'Way Off': return 'text-gray-400';
            case 'Correct': return 'text-cyan-400 font-extrabold';
            default: return 'text-white';
        }
    }

    getRoleClass(): string {
        switch (this.myRole) {
            case 'MainComputer': return 'text-cyan-400';
            case 'J': return 'text-red-500';
            case 'Empath': return 'text-purple-400';
            default: return 'text-blue-300';
        }
    }

    formatEndReason(reason: string): string {
        switch (reason) {
            case 'WordGuessed': return 'The Crew correctly identified the target signal!';
            case 'TimeExpired': return 'Transmission lost. The uplink has timed out.';
            case 'JFound': return 'The Saboteur has been apprehended and neutralized.';
            case 'JEscaped': return 'The Saboteur successfully bypassed the firewall.';
            case 'EmpathAssassinated': return 'The Empath was compromised! Data breach successful.';
            default: return reason || 'Mission Terminated.';
        }
    }

    getRoleDescription(): string {
        switch (this.myRole) {
            case 'MainComputer': return 'You provide binary data to the Crew. Use your tokens wisely.';
            case 'J': return 'Sabotage the signal. Waste time. If the word is found, find the Empath.';
            case 'Empath': return 'Guide the Crew to the word. If you are found by the J, everyone loses.';
            case 'Crew': return 'Analyze the tokens. Decode the signal. Find the hidden J.';
            default: return 'Observing data stream...';
        }
    }
}
