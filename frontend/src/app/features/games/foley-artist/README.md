# Foley Artist

**Status:** Backlog
**Players:** 3-8 (Competitive/Party)
**Time:** 20 Minutes
**Genre:** Audio, Party, Creative

## 🎤 Game Overview
"Foley Artist" challenges players to bring silent video clips to life. One player (the Artist) watches a 5-10 second silent clip. They must perform sound effects in real-time into their microphone. The other players (the Audience), who cannot see the clip, must guess what is happening based purely on the audio performance.

## 📜 Rules
1.  **Roles:**
    *   **Artist:** Watches the video, creates sound.
    *   **Audience:** Listens (blind), guesses.
2.  **Performance:**
    *   Clip starts. Artist sees countdown.
    *   Recording starts. Artist makes noises (slaps table, whistles, verbalizes, claps).
    *   Words are allowed *if* they appear in the clip or are ambient conversation, but "describing" the scene is forbidden.
3.  **Guessing:**
    *   The Audience is presented with 4 options (images or short descriptions).
    *   After listening to the live (or replayed) audio, they vote on which scene matches the sounds.
4.  **Scoring:**
    *   **Artist:** Points for every correct guess.
    *   **Audience:** Points for guessing correctly.
    *   **Bonus:** "Best Sound Design" voting at the end.

## 🏗️ Components & Architecture
*   `FoleyGameService`: Manages video sync and WebRTC audio streams.
*   `FoleyComponent`:
    *   `VideoBoothComponent`: Player view (Video + Mic controls).
    *   `ListeningRoomComponent`: Audience view (Visualizer + Voting).
    *   `ClipLibraryService`: Fetches random stock footage (Pexels/Pixabay API).

## 💡 Architecture Options
*   *Option A (Live):* Real-time WebRTC. Artist performs live. Lowest latency required.
*   *Option B (Recorded):* Artist records blob, uploads, then it plays for everyone. Safer for sync.
