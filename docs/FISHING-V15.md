# Fishing anatomy repair · V15

The supplied missed-cast screenshot exposed an extraction error in the V14 pose atlas. Its packer removed every pixel above row27 except a narrow right-edge strip. That cut off the generated shoulders and waiting forearms. Casual striding legs also crossed that strip, and source artwork from neighboring cells left detached fragments.

`prepare-fishing-v15.mjs` repacks the original generated artwork with measured shoulder and arm regions. It keeps the complete body component before and after extraction, including the raised elbow and striding legs. The 160×168 atlas and its four pose columns remain compatible with the manifest. The original five FNAF plush images and lake background are unchanged.

`fishing-scene.js` composes the native personalized face and hair above a body offset6px down. A 40×64 actor canvas keeps the whole figure and its feet. Each caña starts at a measured real palm and draws behind the actor; the artificial skin-colored square was removed. The unchanged gameplay still allows missed casts, saves catches immediately and unlocks Ponyo at five different plushies.

Validation:

- `node --test tests/fishing-anatomy-v15.test.js`: both tests pass. All12poses have a continuous path from the actual palm through torso to feet, with no detached pixels. Waiting shoulders must survive the former row27 cutoff.
- `node scripts/capture-fishing-v15.mjs`: eleven full-game screenshots plus the actual native waiting actor. The exact wedding/black-hair/glasses-on/5of5 missed cast is reproduced by allowing the normal bite to expire.
- Additional captures cover all three outfits, glasses off, pastel pink/light blond/brown hair, desktop, portrait phone, landscape and the complete cast/wait/reel/catch sequence.
- Capture result contains no JavaScript errors or missing local assets.

Evidence: [qa-fishing-v15/result.json](qa-fishing-v15/result.json), [exact missed cast](qa-fishing-v15/wedding-complete-missed-desktop.png), [phone catch](qa-fishing-v15/alternative-phone-caught.png), [cast sequence](qa-fishing-v15/wedding-sequence-01-cast.png).
