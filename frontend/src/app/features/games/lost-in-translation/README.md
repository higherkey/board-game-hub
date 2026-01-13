# Lost In Translation (Based on: Bad Translator)

**Status:** Backlog
**Players:** 3-12
**Time:** 15-20 Minutes
**Genre:** Word, Humor, Puzzle

## 🗣️ Game Overview
A popular idiom, movie quote, or song lyric is run through Digital Translation purgatory (e.g., English -> Japanese -> Russian -> Latin -> English). The result is a garbled mess of synonyms. Players must race to identify the **Original Phrase**. If no one guesses it, players submit their own "fake originals" and vote on the best one.

## 📜 Rules
1.  **The Glitch:** The round starts with the "Glitched Phrase".
    *   *Example:* "The early winged creature captures the soil serpent."
2.  **Phase 1: Decoding (Speed)**
    *   Players type what they think the original is.
    *   *Real Answer:* "The early bird catches the worm."
    *   First to solve gets max points.
3.  **Phase 2: Bluffing (If no solve)**
    *   If the phrase is too hard, the game switches to "Poppycock Mode".
    *   Players write a plausible original phrase.
    *   Everyone votes on which one they think is "Real" (or funniest).
4.  **Scoring:**
    *   **Speed:** +Points for fast correct answer.
    *   **Bluff:** +Points for fooling others.

## 🏗️ Components & Architecture
*   `TranslationService`: (Backend) Connects to Google/LibreTranslate API during content generation (or uses pre-cached library).
*   `TextInputComponent`: Robust fuzzy matching (Levenshtein distance) to accept "The early bird gets the worm" as correct even if "catches" was the strict answer.
*   `GlitchedTextEffect`: Visual shader that corrupts text visually for flavor.

## 💡 Content Strategy
*   **Categories:** Movie Lines, Pop Songs, Idioms, Famous Insults.
*   **Difficulty:**
    *   Easy: 3 translation hops.
    *   Hard: 10 translation hops.
