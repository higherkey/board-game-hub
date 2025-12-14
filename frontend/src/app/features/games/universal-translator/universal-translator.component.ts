import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../services/signalr.service';

@Component({
    selector: 'app-universal-translator',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-full flex flex-col items-center justify-center p-4 bg-gray-900 text-white font-mono gap-4">
      
      <!-- HEADER: Phase & Timer -->
      <div class="w-full max-w-4xl flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-lg">
         <div class="flex flex-col">
             <h2 class="text-xl font-bold text-cyan-400">UNIVERSAL TRANSLATOR</h2>
             <span class="text-sm text-gray-400">Phase: {{ gameState?.phase }}</span>
         </div>
         <div class="text-3xl font-bold text-red-500" *ngIf="gameState?.phase === 'Day'">
             {{ timerDisplay }}
         </div>
      </div>

      <!-- MAIN AREA -->
      <div class="w-full max-w-4xl flex-1 flex gap-4 overflow-hidden">
        
        <!-- RIGHT: Log / History -->
        <div class="w-1/3 bg-gray-800 rounded-lg p-4 flex flex-col gap-2 overflow-y-auto border border-gray-700">
           <h3 class="font-bold text-gray-300 border-b border-gray-600 pb-2">Transmission Log</h3>
           <div *ngFor="let entry of gameState?.tokenHistory" class="text-sm p-2 bg-gray-700/50 rounded">
                <span class="text-xs text-gray-500">{{ entry.timestamp | date:'mm:ss' }}</span><br/>
                <span class="font-bold" [ngClass]="getTokenClass(entry.token)">{{ entry.token }}</span>
           </div>
        </div>

        <!-- LEFT: Role View -->
        <div class="flex-1 bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center border border-gray-700 relative">
            
            <!-- ROLE REVEAL / INFO -->
            <div class="absolute top-4 left-4">
               <span class="text-xs uppercase tracking-widest text-gray-500">Your Role</span>
               <div class="text-xl font-bold" [ngClass]="getRoleClass()">{{ myRole }}</div>
               <div *ngIf="myTargetWord" class="mt-2 text-sm bg-black/50 px-2 py-1 rounded">
                   Target: <span class="text-yellow-400 font-mono">{{ myTargetWord }}</span>
               </div>
            </div>

            <!-- RESULT SCREEN -->
            <div *ngIf="gameState?.phase === 'Result'" class="text-center animate-fade-in">
                <h1 class="text-4xl font-bold mb-4">{{ gameState?.winner }} Wins!</h1>
                <p class="text-gray-400 mb-8">{{ formatEndReason(gameState?.endReason) }}</p>
                <div class="text-sm text-gray-500">
                     Word was: <span class="text-white">{{ gameState?.targetWord }}</span>
                </div>
            </div>

            <!-- MAIN COMPUTER VIEW (Day) -->
            <div *ngIf="isMainComputer && gameState?.phase === 'Day'" class="flex flex-col gap-4 w-full h-full justify-center items-center">
                <p class="text-center text-cyan-200 mb-4 animate-pulse">Incoming Audio Query...</p>
                <div class="grid grid-cols-2 gap-4 w-full max-w-md">
                     <button (click)="sendToken('Yes')" class="btn-token bg-green-600 hover:bg-green-500">YES</button>
                     <button (click)="sendToken('No')" class="btn-token bg-red-600 hover:bg-red-500">NO</button>
                     <button (click)="sendToken('Maybe')" class="btn-token bg-yellow-600 hover:bg-yellow-500">MAYBE</button>
                     <button (click)="sendToken('So Close')" class="btn-token bg-purple-600 hover:bg-purple-500">SO CLOSE</button>
                     <button (click)="sendToken('Way Off')" class="btn-token bg-gray-600 hover:bg-gray-500">WAY OFF</button>
                     <button (click)="sendToken('Correct')" class="btn-token bg-cyan-600 hover:bg-cyan-500 col-span-2">CORRECT!</button>
                </div>
            </div>

            <!-- CREW VIEW (Day) -->
            <div *ngIf="!isMainComputer && gameState?.phase === 'Day'" class="text-center opacity-80">
                <div class="text-6xl mb-4">🎤</div>
                <p>Ask the Main Computer questions.</p>
                <p class="text-xs text-gray-400 mt-2">Wait for the token response.</p>
            </div>

            <!-- VOTE VIEW (VotingForJ) -->
             <div *ngIf="gameState?.phase === 'VotingForJ'" class="w-full flex flex-col items-center">
                 <h3 class="text-xl text-red-400 mb-4">Time Expired! Find the J!</h3>
                 <p class="mb-4 text-sm text-gray-400">Select the player you suspect:</p>
                 <div class="grid grid-cols-2 gap-2 w-full max-w-md">
                     <button *ngFor="let p of otherPlayers" 
                             (click)="vote(p.connectionId)"
                             class="p-3 bg-gray-700 hover:bg-red-900 border border-gray-600 rounded text-left flex justify-between transition-colors"
                             [class.border-red-500]="myVote === p.connectionId">
                         <span>{{ p.name }}</span>
                         <span *ngIf="myVote === p.connectionId">👁️</span>
                     </button>
                 </div>
                 <div class="mt-4 text-xs text-gray-500" *ngIf="myVote">Vote Cast. Waiting for others...</div>
             </div>

             <!-- J GUESS VIEW (JGuessingEmpath) -->
             <div *ngIf="gameState?.phase === 'JGuessingEmpath'" class="w-full flex flex-col items-center">
                 <ng-container *ngIf="isJ; else crewWaiting">
                     <h3 class="text-xl text-purple-400 mb-4">Word Found! Identify the Empath!</h3>
                     <p class="mb-4 text-sm text-gray-400">If you find the Empath, you steal the win.</p>
                     <div class="grid grid-cols-2 gap-2 w-full max-w-md">
                         <button *ngFor="let p of otherPlayers" 
                                 (click)="vote(p.connectionId)"
                                 class="p-3 bg-gray-700 hover:bg-purple-900 border border-gray-600 rounded text-left transition-colors">
                             {{ p.name }}
                         </button>
                     </div>
                 </ng-container>
                 <ng-template #crewWaiting>
                     <h3 class="text-xl text-gray-400 animate-pulse">J is hunting the Empath...</h3>
                 </ng-template>
             </div>

        </div>
      </div>
    </div>
  `,
    styles: [`
    .btn-token {
        @apply py-6 rounded-lg font-bold text-xl transition-transform active:scale-95 shadow-md border-b-4 border-black/20;
    }
  `]
})
export class UniversalTranslatorComponent implements OnChanges {
    @Input() room!: Room;

    gameState: any;
    myRole: string = 'Loading...';
    myTargetWord: string | null = null;
    timerDisplay: string = '00:00';
    private timerInterval: any;

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

    vote(targetId: string) {
        this.myVote = targetId;
        this.signalR.submitUniversalTranslatorVote(targetId);
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
        // GameEndReason enum to text
        return reason; // "WordGuessed", "JFound" etc.
    }
}
