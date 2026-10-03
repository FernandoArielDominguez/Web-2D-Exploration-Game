---
name: Sprite-sheet animation
description: Non-obvious constraints when integrating the Emberwild pixel-art animation atlases.
---

The supplied Emberwild sprite atlases do not use one universal frame stride across every row. Treat the source origin, frame size, and horizontal stride as per-animation data. Crop inside each frame so grid lines and labels stay out of the animation.

For dark reference boards, remove only the connected background around each cropped frame. A global brightness key can erase dark pixel-art outlines; flood-filling from the crop edge keeps enclosed outlines and shadows intact. Do not apply another dark-color key to a strip that already has transparency.

**Why:** Earlier crops included atlas markings, and globally removing dark colors from the new fire sheet would also damage its outlines.

**How to apply:** Define each animation track with its own crop geometry and stride. Preprocess opaque atlas frames from their edges, or keep existing alpha unchanged, before compositing them over the scene.