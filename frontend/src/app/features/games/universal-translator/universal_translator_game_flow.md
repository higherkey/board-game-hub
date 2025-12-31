# Universal Translator Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Universal Translator".
- **Start**: Click "Start Game".

## 2. Translation Chain Phase
- **Concept**: Telephone game but with Google Translate.
- **View**:
    - **Player**: "Translate this phrase to [Language]".
    - **Board**: Progress indicators.
- **Action**:
    - Player writes translation.
    - Next player gets that translation and translates to next language.

## 3. Result Phase
- **View**:
    - **Board**: Shows the chain. Original Phrase -> Lang 1 -> ... -> Final Result.
    - Comparison: Original vs Final.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.

---

# Verification Notes
- Verify API interactions (if any real translation API is used, or if it's manual).
- Verify Host controls.
