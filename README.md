<p align="center"><img src="assets/arcade.svg" width="920" alt="RoboMaze Gesture Arcade, with a mint pixel robot and a pink portal"></p>

<p align="center">
  <a href="#run-locally"><img alt="Run RoboMaze locally" src="https://img.shields.io/badge/RUN-LOCALLY-7ef5b3?style=for-the-badge&labelColor=251439"></a>
  <a href="#controls"><img alt="Read the controls" src="https://img.shields.io/badge/CONTROL-GUIDE-f674ca?style=for-the-badge&labelColor=251439"></a>
  <a href="#how-it-works"><img alt="Explore the model" src="https://img.shields.io/badge/COMPUTER-VISION-ffe776?style=for-the-badge&labelColor=251439"></a>
</p>

## Play

Start the game using the [local setup](#run-locally).

1. Press **Start Game** to open the control setup.
2. Press **Enter Maze** and allow webcam access. Choose **Enter with keyboard or touch** for manual play.
3. Follow the dotted yellow maze drawn over your mirrored camera feed. Guide the robot to the pink portal in **Neon Depot**, **Circuit Garden**, and **Midnight Relay**.

## Controls

| Input | Action |
| :--- | :--- |
| Index finger points ↑ ↓ ← → | Move in that direction on the mirrored preview |
| **Gesture movement** menu | Hold to repeat in corridors, or choose one step per point for tight turns |
| Relax your hand or point diagonally | Stop gesture movement |
| Arrow keys, WASD, or on-screen arrows | Move one tile per input |
| Restart level | Return to the starting tile and reset the counters |

<details>
<summary><strong>✦ Webcam tips</strong></summary>

Show one hand in good light with the full palm visible. Extend your index finger and curl your middle, ring, and little fingers. Hold the gesture briefly to start moving. Use **Disable camera** to stop the feed. If permission is blocked, you can still play and retry from the hand tracker panel.

</details>

## How it works

The pretrained [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js) estimates 21 landmarks per hand. RoboMaze checks finger extension from those landmarks, mirrors the horizontal direction to match the preview, and maps a stable point to a grid move. The maze engine checks each move for wall collisions and generates three reproducible layouts using seeded depth-first search.

<details>
<summary><strong>✦ Trace a gesture from camera to maze</strong></summary>

| Stage | Implementation |
| :--- | :--- |
| Webcam frame → landmarks | MediaPipe’s pretrained model runs in the browser using WebAssembly |
| Landmarks → direction | Finger geometry and the index finger’s dominant axis |
| Direction → movement | 140 ms stability threshold, 255 ms movement cooldown, and collision checks. Step mode also requires 140 ms of neutral input before the next point. |

The browser downloads model and runtime files when you enable the camera. Webcam frames are processed locally. The game has no backend or API key.

</details>

## Run locally

Clone the repository, open its root, and run:

```sh
python -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Camera permission requires HTTPS or localhost. Gesture mode needs internet access to download MediaPipe and the model.


For GitHub Pages hosting, set the publishing source to the root of `main` in the repository’s Pages settings.
