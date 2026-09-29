---
name: Sprite-sheet animation
description: Non-obvious constraints when integrating the Emberwild pixel-art animation atlases.
---

The supplied Emberwild sprite atlases do not use one universal frame stride across every row. Treat the source origin, frame size, and horizontal stride as per-animation data. Their dark reference-board backgrounds also need to be keyed to transparency before drawing over the game art.

**Why:** Using a single stride selected the labels and neighboring rows, while drawing the raw atlas introduced dark rectangles over the title artwork.

**How to apply:** Define each animation track with its own crop geometry and preprocess the atlas into a transparent canvas before compositing it over the scene.