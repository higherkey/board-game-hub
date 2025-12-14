import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../services/signalr.service';

@Component({
  selector: 'app-wisecrack-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col items-center justify-center p-4 bg-gray-900 text-white text-center">
      
      <!-- Phase: Lobby/Writing -->
      <div *ngIf="isWriting" class="flex flex-col gap-6">
        <h1 class="text-4xl font-bold text-yellow-400">Step 1: Be Funny</h1>
        <p class="text-xl">Players are writing their answers...</p>
        <div class="text-6xl animate-pulse">?</div>
        <div class="mt-8 text-sm opacity-70">
          Answers: {{answerCount}} / {{expectedAnswers}}
        </div>
      </div>

      <!-- Phase: Battling -->
      <div *ngIf="isBattling && currentBattle" class="w-full max-w-4xl flex flex-col gap-8">
        <h2 class="text-3xl font-bold uppercase tracking-widest text-blue-400">Battle!</h2>
        
        <!-- Prompt -->
        <div class="bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-yellow-500">
          <p class="text-3xl md:text-5xl font-extrabold leading-tight">
            {{currentBattle.promptText}}
          </p>
        </div>

        <!-- Answers -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <!-- Answer A -->
          <div class="bg-blue-600 p-8 rounded-xl relative transform transition-all duration-300"
               [class.scale-105]="battleWinner === 'A'"
               [class.opacity-50]="battleWinner === 'B'">
            <div class="text-2xl md:text-3xl font-bold">{{currentBattle.answerA.text}}</div>
            <div *ngIf="battleWinner" class="mt-4 text-sm font-bold uppercase tracking-wide bg-black/30 p-2 rounded">
              {{currentBattle.answerA.playerName}}
            </div>
            <!-- Vote Count Reveal -->
            <div *ngIf="battleWinner" class="absolute -top-4 -right-4 bg-yellow-500 text-black font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-xl">
              {{getVotes('A')}}
            </div>
          </div>

          <!-- Answer B -->
          <div class="bg-red-600 p-8 rounded-xl relative transform transition-all duration-300"
               [class.scale-105]="battleWinner === 'B'"
               [class.opacity-50]="battleWinner === 'A'">
            <div class="text-2xl md:text-3xl font-bold">{{currentBattle.answerB.text}}</div>
            <div *ngIf="battleWinner" class="mt-4 text-sm font-bold uppercase tracking-wide bg-black/30 p-2 rounded">
              {{currentBattle.answerB.playerName}}
            </div>
            <!-- Vote Count Reveal -->
            <div *ngIf="battleWinner" class="absolute -top-4 -right-4 bg-yellow-500 text-black font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-xl">
              {{getVotes('B')}}
            </div>
          </div>
        </div>

        <!-- Controls (Host only usually, but board triggers) -->
        <div *ngIf="battleWinner" class="mt-8">
          <button (click)="nextBattle()" class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full text-xl shadow-lg transition-transform transform active:scale-95">
            Next Battle &rarr;
          </button>
        </div>
        <div *ngIf="!battleWinner" class="text-center animate-pulse text-yellow-300 mt-4 text-lg">
          Vote now on your device!
        </div>
      </div>

      <!-- Phase: Result (End of Line) -->
      <div *ngIf="isResult" class="text-center">
        <h1 class="text-5xl font-bold mb-8">Game Over</h1>
        <div class="flex flex-col gap-4 text-2xl">
           <div *ngFor="let p of sortedPlayers" class="flex justify-between w-96 bg-gray-800 p-4 rounded text-white">
             <span>{{p.name}}</span>
             <span class="font-bold text-yellow-400">{{p.score}}</span>
           </div>
        </div>
      </div>

    </div>
  `
})
export class WisecrackBoardComponent implements OnChanges {
  @Input() room!: Room;

  constructor(private signalRService: SignalRService) { }

  ngOnChanges(): void {
    // React to changes
  }

  get state(): any {
    return this.room.gameData;
  }

  get isWriting(): boolean {
    return this.state?.phase === 'Writing';
  }

  get isBattling(): boolean {
    return this.state?.phase === 'Battling';
  }

  get isResult(): boolean {
    return this.state?.phase === 'Result';
  }

  get answerCount(): number {
    return this.state?.answers?.length || 0;
  }

  get expectedAnswers(): number {
    return (this.room.players.length || 0) * 2;
  }

  get currentBattle(): any {
    return this.state?.battles?.[this.state.currentBattleIndex];
  }

  get battleWinner(): string | null {
    if (!this.currentBattle?.isFinished) return null;
    // Basic logic: if finished, who won?
    // Backend assigns distinct WinnerPlayerId. 
    // If WinnerPlayerId == AnswerA.PlayerId => 'A'
    if (this.currentBattle.winnerPlayerId === this.currentBattle.answerA.playerId) return 'A';
    if (this.currentBattle.winnerPlayerId === this.currentBattle.answerB.playerId) return 'B';
    if (this.currentBattle.winnerPlayerId === 'TIE') return 'TIE';
    return null;
  }

  getVotes(option: 'A' | 'B'): number {
    if (!this.currentBattle) return 0;
    const choice = option === 'A' ? 0 : 1;
    return this.currentBattle.votes.filter((v: any) => v.choice === choice).length;
  }

  get sortedPlayers(): any[] {
    return [...this.room.players].sort((a, b) => b.score - a.score);
  }

  nextBattle() {
    this.signalRService.nextWisecrackBattle();
  }
}

