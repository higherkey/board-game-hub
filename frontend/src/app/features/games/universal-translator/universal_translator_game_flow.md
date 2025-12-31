# Universal Translator Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Universal Translator".
- **Start**: Click "Start Game".

## 2. Setup Phase (Roles)
- **Action**: System assigns roles.
    - **Main Computer** (Mayor/Magician): Knows the word. Validates guesses.
    - **J** (Traitor/Werewolf): Knows the word. Tries to mislead without being caught.
    - **Empath** (Seer): Knows the word. Tries to help without being identified by J.
    - **Crew** (Villagers): Guessers.
- **View**:
    - **Main Computer**: Sees word choices. Selects one.
    - **J / Empath**: See the selected word.
    - **Crew**: "Waiting for word selection...".

## 3. Day Phase (Guessing)
- **State**: `phase = Day`.
- **View**:
    - **Main Computer**: Buttons for "Yes", "No", "Maybe", "So Close", "Way Off", "Correct". Token Counts.
    - **Others**: Chat/Voice to ask questions.
- **Action**:
    - Crew asks Yes/No questions.
    - Main Computer answers using Buttons (Tokens are limited!).
    - **Logic**:
        - "Correct" -> Crew Wins (unless J finds Empath).
        - Tokens run out -> Voting Phase.

## 4. Voting / J Phase
- **Scenarios**:
    - **Word Guessed**: `JGuessingEmpath`. J has one shot to identify the Empath to steal the win.
    - **Time/Tokens Expired**: `VotingForJ`. All players vote for who they think is J.
        - If J removed -> Crew Wins.
        - If J escapes -> J Wins.

## 5. Result Phase
- **View**: "Winner: Crew" or "Winner: J". Reasoning (e.g. "J Escaped", "Empath Assassinated").
- **Action**: **End Game**.

---

# Discrepancies / Notes
1.  **Genre Divergence**: This is implemented as **Werewords** (Hidden Role 20 Questions), NOT Telephone.
    - **Recommendation**: Rename to "Space Werewolf" or "Traitor's Dictionary" if "Universal Translator" is confusing.
2.  **Scoring**: Binary Win/Loss logic implemented.
3.  **Roles**: Logic handles < 4 players (Computer, J, Crew) gracefully.
