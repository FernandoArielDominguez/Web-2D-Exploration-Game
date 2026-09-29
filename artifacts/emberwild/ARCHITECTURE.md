# Emberwild architecture

## Runtime flow

```text
Input
  -> GameLoop fixed update
  -> Player movement
  -> Camera follow and bounds
  -> World and entity render
  -> UI snapshot event
  -> next animation frame
```

`Game` is a composition root, not a domain god object. It wires together the loop, input, camera, world, player, and event bus. Each module owns one concern and can be replaced without changing the React shell.

## Coordinate spaces

- **World space:** player and world positions in the meadow.
- **Camera space:** the camera's top-left world position and zoom.
- **Screen space:** canvas pixels after the camera transform.

The `Camera` exposes `worldToScreen` and `screenToWorld` so interaction, culling, construction, and future pointer input can use the same transform.

## UI boundary

`GameCanvas` mounts and unmounts the engine and receives read-only snapshots through the event bus. The UI should display state and send intent back through explicit game methods or system commands; it should not reach into canvas internals.

## Content boundary

The next systems should use data definitions for items, recipes, resources, buildings, enemies, skills, and zones. Systems should consume IDs and definition objects so new content does not require changing core rules.