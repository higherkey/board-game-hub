# Checkers Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Checkers".
- **Players**: 2 Players (1v1).
- **Start**: Click "Start Game".

## 2. Gameplay Phase
- **Grid**: 8x8. Dark squares only.
- **Pieces**: 12 Red vs 12 Black.
- **State**: `phase = Playing`.
- **View**:
    - **Board**: Standard Checkers board.
    - **Active Player**: Indicated.
- **Action**:
    - **Move**: Diagonal forward 1 step.
    - **Jump**: Diagonal forward 2 steps over opponent. Mandatory? (Yes, typically).
    - **King**: Reach end row -> King (Move backwards).

## 3. Win Condition
- **Win**:
    - Eliminate all opponent pieces.
    - Block opponent (No valid moves).
- **Draw**: Repeat pattern or agreement (optional).

## 4. Game End
- **View**: Victory Screen.
- **Action**: Host clicks "Play Again".

---

# Implementation Notes
- **Mandatory Jumps**: Backend must validate moves and force jumps if available.
- **Chain Jumps**: Must allow multi-step turn if jump available.
