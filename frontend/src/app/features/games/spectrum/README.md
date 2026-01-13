# Spectrum (Based to: Wavelength)

**Status:** Backlog
**Players:** 2-12+ (Teams or Co-op)
**Time:** 30-45 Minutes
**Genre:** Social, Party, Deduction

## 🌈 Game Overview
Two teams compete to read each other's minds. A "Psychic" gives a clue on a spectrum between two opposing concepts (e.g., "Hot - Cold"). Their team attempts to turn a dial to the exact point on the spectrum that matches the clue. The opposing team then guesses whether the true target is left or right of the dial for bonus points.

## 📜 Rules
1.  **Teams:** Players split into L/R Teams.
2.  **Psychic:** One player is chosen as Psychic. They see the hidden target position on a spectrum (0-100%).
3.  **The Clue:** The Psychic is given a binary card (e.g., "Rough" <-> "Smooth"). They must give a single clue that fits the target position (e.g., if target is 90% towards Smooth, clue might be "Silk").
4.  **Dialing:** The Psychic's team discusses and rotates the dial to where they think "Silk" falls on the Rough-Smooth scale.
5.  **Catch Up:** The opposing team guesses if the true target is Left or Right of the current dial position.
6.  **Reveal:**
    *   Team scores 4 points for Bullseye, 3 for close, 2 for outer ring.
    *   Opponents score 1 point if their Left/Right guess was correct.
7.  **End:** First team to 10 points wins.

## 🏗️ Components & Architecture
*   `SpectrumGameService`: Syncs dial position in real-time.
*   `SpectrumComponent`:
    *   `DialComponent`: SVG/Canvas interactive knob.
    *   `SpectrumCardComponent`: Displays the binary concepts.
    *   `TargetOverlayComponent`: Visible only to Psychic and during reveal.

## 🏷️ 50 Alternative Names
1.  Spectrum
2.  Frequency
3.  Wavelengths
4.  Tune In
5.  Dial It In
6.  On The Level
7.  Same Page
8.  Mind Meld
9.  Vibe Check
10. Resonance
11. Calibration
12. The Scale
13. Sliding Scale
14. Fine Lines
15. Between The Lines
16. The Sweet Spot
17. Range Finders
18. Bandwidth
19. Signal & Noise
20. Interference
21. Synced
22. Brainwaves
23. ThoughtStream
24. Align
25. Middle Ground
26. Polar Opposites
27. Shades of Grey
28. Binary
29. Read My Mind
30. Telepathy Test
31. Social Spectrum
32. The Gauge
33. Pressure Gauge
34. Meter Readers
35. Needle in a Haystack
36. The Needle
37. Pointer
38. Vector
39. Magnitude
40. Gradient
41. Phase Shift
42. Amplitude
43. Oscilloscope
44. Feedback Loop
45. Radio Heads
46. Station 2 Station
47. Common Ground
48. Perfect Pitch
49. Range Rover
50. Zero In
