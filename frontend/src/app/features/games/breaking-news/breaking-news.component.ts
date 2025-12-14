import { Component, Input, OnChanges, OnInit, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../../services/signalr.service';

// augment the global scope for SpeechRecognition (Chrome only for now)
declare var webkitSpeechRecognition: any;

interface ScriptToken {
  id?: number; // for slots
  text: string;
  isSlot: boolean;
  type?: string;
  isSpoken: boolean; // "Karaoke" state
}

@Component({
  selector: 'app-breaking-news',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './breaking-news.component.html',
  styleUrl: './breaking-news.component.scss'
})
export class BreakingNewsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() room: any; // Type 'Room' properly if available
  @Input() myConnectionId: string = '';

  state: any; // BreakingNewsState

  // Local Derived State
  isAnchor: boolean = false;
  mySlots: any[] = [];

  // Teleprompter State
  scriptTokens: ScriptToken[] = [];
  currentWordIndex: number = 0; // Index in scriptTokens we are currently expecting
  scrollPosition: number = 0;

  // Playback Control
  isPlaying: boolean = false; // Manual auto-scroll
  isListening: boolean = false; // Voice tracking
  scrollInterval: any;

  // Speech Recognition
  recognition: any;

  constructor(
    private readonly signalRService: SignalRService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.processState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['room']) {
      this.processState();
    }
  }

  ngOnDestroy() {
    this.stopScrolling();
    this.stopListening();
  }

  processState() {
    if (!this.room?.gameData) return;

    this.state = this.room.gameData;

    if (!this.myConnectionId) {
      this.myConnectionId = this.signalRService.getConnectionId() ?? '';
    }

    this.isAnchor = this.state.anchorConnectionId === this.myConnectionId;

    if (this.isAnchor) {
      // Prepare Teleprompter View
      // Only parse if we haven't already (or if script changed drastically?)
      // For real-time updates of slots, strict re-parsing might lose "isSpoken" state if we aren't careful.
      // But preserving isSpoken is simple: map old tokens to new ones.
      this.updateScriptTokens();

      // If we were auto-playing, we keep playing.
    } else {
      // Prepare Writer View
      this.stopScrolling();
      this.stopListening();
      this.filterMySlots();
    }
  }

  updateScriptTokens() {
    // We want to re-generate tokens but keep "isSpoken" state if possible.
    const oldTokens = this.scriptTokens;
    const newTokens: ScriptToken[] = [];

    // 1. Split script template by slots regex
    const parts = this.state.scriptTemplate.split(/(\{\d+\})/);

    for (const part of parts) {
      if (/\{\d+\}/.test(part)) {
        // SLOT
        const id = Number.parseInt(part.replace('{', '').replace('}', ''), 10);
        const slot = this.state.slots.find((s: any) => s.id === id);

        // Find existing token state if possible? 
        // Slots are easy to map by ID.
        const existing = oldTokens.find(t => t.isSlot && t.id === id);
        const isSpoken = existing ? existing.isSpoken : false;

        newTokens.push({
          isSlot: true,
          id: id,
          text: slot?.currentValue || "______",
          type: slot?.type,
          isSpoken: isSpoken
        });
      } else {
        // TEXT BLOCK
        // split into words, preserving spaces/punctuation attached to words or separate?
        // Simple approach: split by space.
        // We filter out empty strings but keep punctuation attached to words for now.
        const words = part.split(/\s+/).filter((w: string) => w.length > 0);

        for (const w of words) {
          newTokens.push({
            isSlot: false,
            text: w,
            isSpoken: false
          });
        }
      }
    }

    // Restore "isSpoken" based on index if length matches (naive but works for update loop where only slot values change)
    if (oldTokens.length === newTokens.length) {
      for (let i = 0; i < newTokens.length; i++) {
        newTokens[i].isSpoken = oldTokens[i].isSpoken;
      }
    } else {
      // If length mismatch, usually means script loaded first time or changed.
      // Reset logic is implied (new tokens are false).
    }

    this.scriptTokens = newTokens;
  }

  filterMySlots() {
    if (!this.state.slots) return;

    this.mySlots = this.state.slots.filter((slot: any) => {
      const ownerId = this.state.slotOwners[slot.id.toString()];
      return ownerId === this.myConnectionId;
    });
  }

  // --- SCROLLING & PLAYBACK ---

  togglePlay() {
    if (this.isPlaying) {
      this.stopScrolling();
    } else {
      this.startScrolling();
    }
  }

  startScrolling() {
    this.isPlaying = true;
    this.scrollInterval = setInterval(() => {
      this.scrollPosition += 2; // Speed
    }, 50);
  }

  stopScrolling() {
    this.isPlaying = false;
    if (this.scrollInterval) clearInterval(this.scrollInterval);
  }

  // --- VOICE RECOGNITION (The NLP Portion) ---

  toggleVoice() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition is not supported in this browser. Try Chrome.");
      return;
    }

    this.isListening = true;
    this.recognition = new webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      this.handleSpeechResult(event);
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech Error", event);
      if (event.error === 'not-allowed') {
        this.stopListening();
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if we didn't manually stop
      if (this.isListening) {
        this.recognition.start();
      }
    };

    this.recognition.start();
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  handleSpeechResult(event: any) {
    // Look at the latest interim or final result
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;
      if (confidence > 0.01) { // Low bar for partials
        this.matchSpeechToScript(transcript);
      }
    }
  }

  matchSpeechToScript(transcript: string) {
    const spokenWords = transcript.trim().toLowerCase().split(/\s+/);

    // We try to find sequential matches in our scriptTokens starting from currentWordIndex
    let searchIndex = this.currentWordIndex;

    for (const word of spokenWords) {
      // Look ahead up to 5 tokens to find this word (to allow for skipped words or mis-recognitions)
      const lookAheadLimit = 8;

      for (let offset = 0; offset < lookAheadLimit; offset++) {
        const targetIndex = searchIndex + offset;
        if (targetIndex >= this.scriptTokens.length) break;

        const targetToken = this.scriptTokens[targetIndex];
        const targetWord = this.cleanWord(targetToken.text);

        // Fuzzy match: exact or contains
        if (targetWord === word || (targetWord.length > 3 && (targetWord.includes(word) || word.includes(targetWord)))) {
          // MATCH FOUND!
          // Mark all previous skipped tokens as spoken? 
          // Yes, assume they were mumbled or missed.
          for (let k = this.currentWordIndex; k <= targetIndex; k++) {
            this.scriptTokens[k].isSpoken = true;
          }

          this.currentWordIndex = targetIndex + 1;
          searchIndex = this.currentWordIndex; // Validated, move search anchor

          // Auto-Scroll to this element
          this.scrollToToken(targetIndex);
          break; // Move to next spoken word
        }
      }
    }

    this.cdr.detectChanges();
  }

  cleanWord(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]|_/g, "");
  }

  scrollToToken(index: number) {
    const element = document.getElementById(`token-${index}`);
    if (element) {
      const top = element.offsetTop;
      const viewportHeight = window.innerHeight; // Rough approx

      // We want the current word to be ~30% down the screen
      let newScroll = top - (viewportHeight * 0.3);
      if (newScroll < 0) newScroll = 0;

      // Smooth interpolate? 
      // For now, jump or set directly.
      // If we are "playing" (auto-scrolling) simultaneously, this might conflict.
      // We should probably rely on voice for positioning if voice is active.
      this.scrollPosition = newScroll;
    }
  }

  onSlotChange(slotId: number, pendingValue: string) {
    this.signalRService.submitBreakingNewsSlot(slotId, pendingValue);
  }
}
