# Emberwild

Emberwild is an original 2D browser exploration game built around a small, readable vertical slice: explore a living meadow, gather materials, craft tools, build a camp, and uncover what lies beyond the first region.

## Run

```bash
pnpm --filter @workspace/emberwild run dev
```

The game is served through the workspace preview. The production build is generated with `pnpm --filter @workspace/emberwild run build`.

## Phase 1 foundation

The first milestone establishes the browser game foundation:

- Canvas 2D rendering with device-pixel-ratio scaling.
- A fixed-step `requestAnimationFrame` loop with delta time.
- Keyboard input for WASD and arrow keys.
- A world-space player and camera-space rendering.
- A camera that follows the player and clamps to world bounds.
- A placeholder player and authored placeholder meadow rendered from primitives.
- A future-facing `AssetManager` for local sprites and audio.
- An optional debug overlay showing FPS, coordinates, zone, entity count, and camera position.

## Controls

- `WASD` or arrow keys: move.
- `Escape`: reserved for pause.

## Architecture

The code is divided by responsibility under `src/game`:

- `core`: input, loop, camera, assets, and event transport.
- `entities`: world actors such as the player.
- `world`: world bounds and renderable terrain.
- `Game.ts`: the small composition root that connects those modules.
- `GameCanvas.tsx`: the only React bridge around the game engine.

Content systems will be added incrementally as data modules. Resource nodes, recipes, buildings, enemies, and zones should be represented by IDs and definitions rather than branches inside the game loop.

## Future assets

Replace local placeholder assets by loading them through `AssetManager`. Keep gameplay dimensions independent from sprite dimensions so adding idle, walk, attack, resource, enemy, and building sprites does not require changing movement or collision logic.