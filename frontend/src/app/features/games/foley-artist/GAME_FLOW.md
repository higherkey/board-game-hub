# Foley Artist Game Flow

## 1. Setup
*   **Host:** Selects "Foley Artist".
*   **Source:** Uses standard library or allows custom uploads (future).
*   **Order:** Randomize Artist queue.

## 2. Round Start - Briefing
*   **Artist Only:**
    *   Sees the clip (muted). "Study the clip (10s)".
    *   Timeline shows sound cues (optional).
*   **Audience:**
    *   "Waiting for Artist to prepare..." (Elevator music).

## 3. Performance Phase
*   **Countdown:** "Recording in 3... 2... 1..."
*   **Loop:**
    *   Clip plays for Artist.
    *   Artist performs audio.
    *   (Option B) System captures audio buffer.
*   **Review:** Artist can "Retry" once or "Submit".

## 4. Guessing Phase
*   **Content:**
    *   Clip is hidden.
    *   Audio recording plays for everyone.
*   **Options:** 4 Cards appear on screen.
    *   A: "Making a Sandwich"
    *   B: "Packing a Suitcase" (Correct)
    *   C: "Folding Laundry"
    *   D: "Reading a Book"
*   **Vote:** Players select matching Scene.

## 5. Reveal & Score
*   **Reveal:** The actual video clip plays WITH the Artist's audio overlay. (Sync check).
*   **Points:**
    *   +100 per correct guess for Artist.
    *   +50 for correct Audience member.
    *   Awards: "Most Realistic", "Funniest" (Voting).

## 6. Rotation
*   Next player becomes Artist.
*   Repeat until all have performed.
