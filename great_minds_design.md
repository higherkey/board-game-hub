# Game Design: Great Minds

## Overview
**Great Minds** is a cooperative game of silence, intuition, and shared rhythm. Players attempt to play cards numbered 1-100 in ascending order to a central stack. 
**The challenge**: No communication is allowed. Players must feel the flow of time and "read the room" to play their cards at the perfect moment.

*Great minds think alike.*

## Core Mechanics
1.  **The Deal**: 
    -   Level 1 = 1 card each. 
    -   Level 2 = 2 cards each... up to Level 12.
2.  **The Flow**: 
    -   There are no turns. Any player can play their lowest card at any time.
    -   Cards *must* be placed in the center in strictly ascending order.
3.  **The Error**: 
    -   If a player plays a card (e.g., 35) while someone else holds a lower number (e.g., 22), the game pauses. 
    -   The lower card(s) are revealed and discarded. The team loses a **Life**.
4.  **Lives**: 
    -   The team starts with a shared pool of Lives (equal to player count). 
    -   0 Lives = Game Over.
5.  **Sync Token**: 
    -   Start with 1 Sync Token.
    -   At any time, a player can propose a Sync. If agreed, everyone discards their lowest card face up, realigning the group's information.
    -   Earn +1 Sync (and +1 Life) at completing Levels 3, 6, 9.

## UX / UI Design: "Abstract & Ethereal"
**Theme**: Soft, minimalist, elegant. "Zen" aesthetic.
**Palette**: Soft gradients, pastels or calming deep colors (Oceanic/Cosmic), white text, smooth transitions.

### 1. Main Screen (The Canvas)
*   **The Stack**: A clean, central area showing the last played number prominently.
*   **Atmosphere**: A subtle, breathing background animation that reacts to game speed.
*   **HUD**: Minimalist counters for Level, Lives (Hearts), and Syncs (Stars).
*   **Feedback**: 
    *   *Play*: Soft ripple effect expanding from the card.
    *   *Error*: A jarring "shatter" or "break" effect, followed by recomposition.

### 2. Player Controller (The Mind)
*   **Primary Action**: A large, clean circular button displaying the user's **Current Card**.
    *   Text: "32"
    *   *Touch*: Immediate response.
*   **Queue**: Smaller preview of upcoming cards in hand (passive).
*   **Actions**: 
    *   **Propose Sync**: Small, non-intrusive icon.
*   **Haptics**: Subtle heartbeat vibration when holding the button? Stronger vibration on successful play.

## Technical Implementation

### Backend (C# / .NET)

**1. Game State (`GreatMindsGameState`)**
```csharp
public class GreatMindsGameState
{
    public int CurrentLevel { get; set; } = 1;
    public int Lives { get; set; }
    public int SyncTokens { get; set; }
    public List<int> Deck { get; set; } // 1-100
    public Dictionary<string, List<int>> PlayerHands { get; set; }
    public int TopCard { get; set; } = 0;
    
    // Status
    public bool IsLevelComplete => PlayerHands.All(h => h.Value.Count == 0);
    public bool IsGameOver => Lives <= 0;
}
```

**2. Game Service (`GreatMindsGameService`)**
*   **Logic**:
    *   **PlayCard(playerId, cardValue)**: 
        *   If `cardValue` is not player's lowest, reject.
        *   If `cardValue < min(allOtherHands)`, Success. Update `TopCard`.
        *   If `cardValue > min(allOtherHands)`, Error. 
            *   Trigger `ErrorEvent`: Reveal lower cards, remove them, decrement Lives.
    *   **UseSync()**: 
        *   Remove lowest card from ALL hands. Broadcast "Sync Event" showing what was removed.

### Frontend (Angular)

**1. Components**
*   `GreatMindsGameComponent`: Main container.
*   `GreatMindsBoardComponent`: The shared screen (TV).
*   `GreatMindsPlayerComponent`: The mobile controller.

**2. Visuals**
*   Use CSS transitions for everything. The numbers should "float" into place.
*   **Color Mapping**: Map numbers 1-100 to a color gradient (e.g., 1 = Cool Blue, 100 = Hot Pink) to give players a subconscious visual cue of "where they are" in the range.

## File Structure
*   `Backend/Services/Games/GreatMinds/`
    *   `GreatMindsGameService.cs`
    *   `GreatMindsGameState.cs`
*   `Frontend/src/app/games/great-minds/`
    *   `great-minds.component.ts`
    *   `great-minds-board.component.ts`
    *   `great-minds-player.component.ts`
    *   `great-minds.scss` (Shared styles)
