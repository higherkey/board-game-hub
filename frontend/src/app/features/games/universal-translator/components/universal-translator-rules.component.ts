import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-universal-translator-rules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-gray-900 border-2 border-cyan-500 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_30px_rgba(6,182,212,0.5)]">
        
        <!-- HEADER -->
        <div class="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <h2 class="text-2xl font-bold text-cyan-400 font-mono tracking-tighter">MISSION DEBRIEF: RULES</h2>
          <button (click)="dismiss.emit()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <!-- CONTENT -->
        <div class="p-8 space-y-8 font-mono text-gray-300">
          
          <section>
            <h3 class="text-cyan-400 mb-2 border-l-4 border-cyan-600 pl-3">OBJECTIVE</h3>
            <p>The <span class="text-white">CREW</span> must decode the target signal (guessing the word) before time expires. However, a <span class="text-red-500 font-bold">J (Trickster)</span> is among you, attempting to lead you astray.</p>
          </section>

          <section>
            <h3 class="text-cyan-400 mb-4 border-l-4 border-cyan-600 pl-3">THE ROLES</h3>
            <div class="grid gap-4">
              <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <span class="text-cyan-400 font-bold">MAIN COMPUTER (The Mayor)</span>
                <p class="text-sm mt-1">Knows the target word. Answers Crew questions using limited digital tokens (YES, NO, MAYBE, etc.).</p>
              </div>
              <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <span class="text-red-500 font-bold">THE J (The Saboteur)</span>
                <p class="text-sm mt-1">Knows the target word. Tries to misleadingly influence questions or waste time. Wins if the word remains hidden.</p>
              </div>
              <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <span class="text-purple-400 font-bold">THE EMPATH (The Seer)</span>
                <p class="text-sm mt-1 font-italic italic">Knows the target word. Tries to guide the Crew without being discovered by the J.</p>
              </div>
               <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <span class="text-blue-300 font-bold">CREW (The Investigators)</span>
                <p class="text-sm mt-1">Don't know the word. Must ask clever questions to narrow it down.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 class="text-cyan-400 mb-2 border-l-4 border-cyan-600 pl-3">OUTCOMES</h3>
            <div class="space-y-4">
              <div>
                <p class="text-white font-bold underline">Word Guessed!</p>
                <p class="text-sm">The <span class="text-red-500">J</span> has one last chance to steal the victory by correctly identifying the <span class="text-purple-400 font-bold">Empath</span>.</p>
              </div>
              <div>
                <p class="text-white font-bold underline">Time Expired!</p>
                <p class="text-sm">The Crew must vote on who the <span class="text-red-500 font-bold">J</span> is. If they catch them, the Crew wins. If they miss, the J escapes with the data.</p>
              </div>
            </div>
          </section>

        </div>

        <!-- FOOTER -->
        <div class="p-6 border-t border-gray-800 text-center">
            <button (click)="dismiss.emit()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105">
                UNDERSTOOD
            </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #111827; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  `]
})
export class UniversalTranslatorRulesComponent {
  /** Emitted when the user closes the rules overlay */
  @Output() dismiss = new EventEmitter<void>();
}
