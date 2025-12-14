import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../services/signalr.service';

@Component({
  selector: 'app-wisecrack-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto">
      
      <!-- Phase: Writing -->
      <div *ngIf="isWriting" class="flex flex-col gap-6 max-w-md mx-auto">
        <h2 class="text-2xl font-bold dark:text-white text-center">Your Prompts</h2>
        
        <div *ngFor="let assignment of myAssignments; let i = index" 
             class="bg-white dark:bg-gray-700 p-4 rounded shadow">
          <p class="font-bold text-lg mb-2 dark:text-gray-200">
            {{assignment.text}}
          </p>
          <div *ngIf="!hasAnswered(assignment.promptId); else answeredTemplate">
            <textarea 
              [(ngModel)]="inputs[assignment.promptId]" 
              rows="3"
              class="w-full p-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-600 mb-2"
              placeholder="Type something funny...">
            </textarea>
            <button 
              (click)="submitAnswer(assignment.promptId)"
              [disabled]="!inputs[assignment.promptId]"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded">
              Submit
            </button>
          </div>
          <ng-template #answeredTemplate>
            <div class="text-green-600 dark:text-green-400 font-bold flex items-center gap-2">
              <span>✓ Submitted</span>
            </div>
            <p class="text-gray-500 italic mt-1">{{inputs[assignment.promptId]}}</p>
          </ng-template>
        </div>
        
        <div *ngIf="myAssignments.length === 0" class="text-center text-gray-500">
          No prompts assigned (Waiting...)
        </div>
        
        <div *ngIf="allAnswered" class="text-center text-purple-500 font-bold animate-pulse mt-4">
          All done! Waiting for others...
        </div>
      </div>

      <!-- Phase: Battling -->
      <div *ngIf="isBattling" class="flex flex-col items-center justify-center h-full gap-6">
        <div *ngIf="!canVote" class="text-center">
            <h3 class="text-xl dark:text-white mb-2">You are in this battle!</h3>
            <p class="text-gray-500">Hope people vote for you.</p>
        </div>

        <div *ngIf="canVote" class="w-full max-w-sm flex flex-col gap-4">
          <h2 class="text-2xl font-bold dark:text-white text-center mb-4">Vote!</h2>
          
          <button (click)="vote(0)" 
                  class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded-xl text-xl transition-transform active:scale-95 shadow-lg relative overflow-hidden"
                  [disabled]="hasVoted">
            <span class="relative z-10">Vote Left</span>
            <div *ngIf="hasVoted && votedChoice === 0" class="absolute inset-0 bg-white/20 flex items-center justify-center">
               ✓
            </div>
          </button>
          
          <div class="text-center dark:text-gray-400 font-bold">VS</div>

          <button (click)="vote(1)" 
                  class="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-4 rounded-xl text-xl transition-transform active:scale-95 shadow-lg relative overflow-hidden"
                  [disabled]="hasVoted">
            <span class="relative z-10">Vote Right</span>
            <div *ngIf="hasVoted && votedChoice === 1" class="absolute inset-0 bg-white/20 flex items-center justify-center">
               ✓
            </div>
          </button>
          
          <div *ngIf="hasVoted" class="text-center mt-4 text-green-500 font-bold">
            Vote Cast!
          </div>
        </div>
      </div>

      <!-- Phase: Result -->
      <div *ngIf="isResult" class="flex flex-col items-center justify-center h-full text-center">
         <h2 class="text-3xl font-bold dark:text-white">Game Over</h2>
         <p class="dark:text-gray-300">Check the main screen for results!</p>
      </div>

    </div>
  `
})
export class WisecrackPlayerComponent {
  @Input() room!: Room;
  @Input() playerId!: string;

  inputs: { [key: string]: string } = {};
  votedChoice: number | null = null;

  constructor(private signalRService: SignalRService) { }

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

  get myAssignments(): any[] {
    if (!this.state?.assignments) return [];
    return this.state.assignments.filter((a: any) => a.assignedPlayerIds.includes(this.playerId));
  }

  hasAnswered(promptId: string): boolean {
    // Check if my answer for this prompt exists in State
    // AND check if I've locally marked it (for optimistic UI or recovering state)
    // The state.answers is a List.
    const submitted = this.state?.answers?.some((a: any) => a.promptId === promptId && a.playerId === this.playerId);
    return submitted;
  }

  get allAnswered(): boolean {
    if (this.myAssignments.length === 0) return false;
    return this.myAssignments.every(a => this.hasAnswered(a.promptId));
  }

  submitAnswer(promptId: string) {
    const val = this.inputs[promptId];
    if (!val) return;
    this.signalRService.submitWisecrackAnswer(promptId, val);
  }

  // Voting
  get currentBattle(): any {
    return this.state?.battles?.[this.state.currentBattleIndex];
  }

  get canVote(): boolean {
    if (!this.currentBattle) return false;
    // Cannot vote if I am one of the answerers
    if (this.currentBattle.answerA.playerId === this.playerId) return false;
    if (this.currentBattle.answerB.playerId === this.playerId) return false;
    if (this.currentBattle.isFinished) return false;
    return true;
  }

  get hasVoted(): boolean {
    if (!this.currentBattle) return false;
    const voted = this.currentBattle.votes?.some((v: any) => v.playerId === this.playerId);
    // Reset local votedChoice if new battle
    // logic: check if votedChoice matches current battle? 
    // Simpler: just trust state.
    return voted;
  }

  vote(choice: number) {
    this.votedChoice = choice;
    this.signalRService.submitWisecrackVote(choice);
  }
}
