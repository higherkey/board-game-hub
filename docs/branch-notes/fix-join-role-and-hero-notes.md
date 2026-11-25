# Branch Notes: fix/join-role-and-hero

## 1. Discoveries & Deviations
- A returning guest opening a new room link skipped the entry screen and auto-joined with the last saved role, so a computer last used as a Player silently became a Hand. Auto-join now runs only for rooms in `my_active_rooms` (a rejoin).
- The entry screen keeps its device default (desktop = Table, phone = Player) instead of the last saved role, so the computer lands on Table.
- Home hero Join scene reuses the Host room card through one `ng-template`; seats fill with player colors and "Waiting for players" becomes "Ready to play".

## 2. Blockers & Risks (4a)
- None.

## 3. Quick Wins (4b)
- None.

## 4. Deferred Items (4c)
- A rejoin still uses the last global role, not the role this device had in that room. Store the role per active room if this shows up.
