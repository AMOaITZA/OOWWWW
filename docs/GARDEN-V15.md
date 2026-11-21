# Nuestro jardín

`huerto` is a full-screen game scene, entered from the physical garden beside
the house or the house's activities menu. Choose one of six beds, choose cosmos,
lavender or sunflower seeds, plant, water and watch the plants become buds and
flowers. A watered plant blooms after seven seconds of active play. This growth
also works with reduced motion; hiding the tab pauses the active scene.

Harvesting stores one flower. The decoration drawer turns one harvested flower
into a vase for the house. Once made, a vase can be selected again without
spending another flower. “Ver el florero en casa” opens the house directly.
There are no consumable seeds or penalties for choosing another bed.

State lives in `save.garden`, separately from the main map position. Pure state
transitions are in `game/garden.js`. `normalizeGarden` validates old or corrupted
data, `getHomeDecoration` returns the selected vase's atlas rectangle, and
`drawGardenBeds` draws the small 48×32 world marker with its actual plants.

The scene supports bed buttons and canvas taps, arrows/WASD or 1–6 to select a
bed, and E or Space on the focused canvas to use the current tool. All actions
are also ordinary labeled buttons. Portrait screens use the same map with a
camera focused on the selected bed rather than compressing the artwork.

## Resources

- `assets/game/garden/garden.png`: 640×400 opaque generated pixel garden,
  normalized with nearest-neighbor sampling and a bounded palette.
- `assets/game/garden/flowers.png`: 96×128 transparent native pixel artwork;
  three 32-pixel columns are cosmos, lavender and sunflower. Four rows contain
  sprout, bud, blooming plant and the house vase.
- `scripts/create-garden-atlas-v15.mjs` recreates the flower atlas from its
  original native pixel drawing commands.

Background source: `/workspace/generated_images/exec-9641083a-6df0-45f8-9aae-8b68111b2cb2.png`.
Generated specifically for this activity: a cherry-tree garden with a sage
greenhouse, rose arch, six empty wooden beds, a bench and a potting table.

Validation: `node --test tests/garden-v15.test.js` covers saved-data repair,
required watering, the complete growth/harvest cycle, one-time flower spending
and reusable home decoration, invalid actions and responsive camera bounds.

`node scripts/capture-garden-v15.mjs` exercised the actual controls under reduced
motion at 1440×900, 390×844 and 844×390. Nine screenshots and the request/error
report are in `docs/qa-garden-v15`. All three views reached blooming flowers;
the desktop flow harvested a cosmos, made its vase and opened the actual house
to verify it on the shelf. The run reported no page errors or failed assets.
The final watering capture also verifies the can meets Itza's hand.
