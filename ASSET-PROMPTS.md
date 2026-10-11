# Новые изображения · 10 октября 2026

Изображения созданы встроенным инструментом imagegen (без CLI/API). Для фигур использована настоящая прозрачность; альфа сохранена при оптимизации в WebP. Исходные иллюстрации и портреты сохранены. Внешность Бомбо и големши уточнена по восьми предоставленным страницам «про големов.pdf», затем образ Бомбо переработан по просьбам пользователя: текущая версия опирается на первый референс пользователя с цепями: обезображенное лицо, ржавая железная челюсть, ржавые цепи и реалистичная рваная одежда. Движущийся туман, мрамор и спектральное пламя рисуются кодом, изображения задают анатомию.

## assets/phoenix-filaments.webp

Current courtyard phoenix. Built-in imagegen edit of golden-phoenix.webp: a compact hummingbird-like bird woven from golden light filaments, with a slender beak and fine tail strands. [Full prompt](assets/phoenix-filaments.prompt.txt). Optimized to 768 × 768 with alpha preserved. A procedural material makes the space between bright strands translucent and sends moving light through them. Four short exposure samples per wing soften fast figure-eight strokes; the body has small independent hovering corrections.

## assets/golden-phoenix.webp

Preserved earlier design, superseded by phoenix-filaments.webp. Created with built-in imagegen for the courtyard lantern transformation. Full prompt: [golden-phoenix.prompt.txt](assets/golden-phoenix.prompt.txt). Optimized to 768 × 768 with true alpha. The lantern brightens, golden currents gather into a spatially revealed bird, and its two feather fans flap independently around the shoulders. The central body remains stable with a small hovering motion. Motion pause renders a complete static bird.

## assets/djinn-orb.webp

Current city apparition, edited with built-in imagegen from djinn-visitor.webp. Its anatomical right arm reaches toward the viewer with an open, cupped palm. The full prompt is saved in [djinn-orb.prompt.txt](assets/djinn-orb.prompt.txt). Optimized to 960 × 1440 with genuine alpha preserved. The small violet sphere, internal currents, variable intensity and reflected light on the hand are animated in code. The cloud material preserves registration around the palm while the rest of the figure continues drifting.

## assets/golem-bombo-chained.webp

Current asset used for the body, floor reflection and sampled flame silhouette. Generated with built-in imagegen from the user's first chained portrait reference, followed by a focused edit of the clothing and rust. The final costume is torn woven wool and cotton with seams, folds, holes and loose threads; chains and iron fittings have dark pitted oxidation. Optimized to 960 × 1440 with genuine alpha preserved. Both full prompts are saved in [golem-bombo-chained.prompt.txt](assets/golem-bombo-chained.prompt.txt).

The shader preserves restrained rusty brown on the metal, adds dim violet eye and skin-vein shimmer aligned to the new anatomy, and keeps the body dark with sparse marble reflections. Translucent spectral flames assemble the figure from floor shadows, then fade out completely. The finished body is slightly transparent; intermittent branching glimmers propagate from both feet across the marble.

## assets/golem-bombo-cinematic.webp

Preserved intermediate cinematic anatomy; superseded by assets/golem-bombo-chained.webp. Created through a built-in imagegen style-transfer edit of assets/golem-bombo-decayed.webp. Optimized to 960 × 1440 with true RGBA alpha preserved. Final prompt:

> Transform illustrated creature into live-action cinematic horror character photographed with practical prosthetic makeup and costume; same full-body pose, head angle, eye positions, hands, scroll, boots, 2:3 transparent composition. Disfigured half-human half-skeleton face, dead grey peeling skin exposing ashen human cheekbone, orbit and jaw, gaunt ruined human features, no alien mask or clean skull grin. 65mm cinema lens, filmic response, physically correct cool directional light, subtle violet rim, real pores, thin curled dry skin flakes, matte aged bone, realistic frayed wool/cotton and worn leather, low photographic microcontrast, no illustrated linework/plastic shine. Sparse dim violet lights in eye sockets and thin branching violet veins beneath remaining forehead/cheek/neck/hand skin. Near-monochrome ash/charcoal, no red tissue, genuine transparent alpha, no environment, flames or particles baked in.

This intermediate asset established the body, floor reflection and sampled silhouette of the assembling flame. Translucent spectral tongues rise and fold across its interior and edges from the first floor gathering through the complete apparition; their material continues moving after assembly. The photographic creature supplies the ruined human features, peeling skin, exposed bone and costume texture. Procedural rendering supplies shifting flames, sparse desaturated marble highlights and shimmering violet tracery on the actual remaining skin and in the eyes. No initial grey spark shower is emitted.

## assets/golem-bombo-decayed.webp

Preserved intermediate head edit of assets/golem-bombo-nightmare.webp. This revision replaced the alien-looking face with a disfigured half-human, half-skeletal face with peeling grey skin and exposed ashen bone. It supplied the anatomy and pose for the final cinematic style-transfer edit; the site now uses assets/golem-bombo-chained.webp.

## assets/golem-bombo-nightmare.webp

Preserved intermediate concept, replaced by the decayed face edit and then assets/golem-bombo-cinematic.webp. Edited with built-in imagegen from assets/golem-bombo.webp, with assets/marble.webp as the material and illumination reference. Optimized to 960 × 1440 with true alpha preserved. Original edit prompt:

> Edit existing golem: substantially more frightening and less human; elongated asymmetrical inhuman head, deep sunken orbital hollows with violet slits, almost absent collapsed nose, hollow cheeks, elongated crooked jaw and narrow unnatural dark mouth fissure; blackened ashen mineral flesh under cracked obsidian membrane; gaunt inhuman proportions and elongated knotted fingers; charcoal cloak, papyrus scroll, rare pearly marble reflections, violet eyes and hand veins; same full-body three-quarter pose/framing, true transparent alpha, no environment, no baked flames or particles, no gore, horns or armor.

Its full-body pose and spectral palette informed the later edits. The elongated inhuman head described in this prompt is an intermediate design; the final creature has ruined human anatomy beneath peeling grey skin and visible bone.

## assets/golem-bombo.webp

Preserved earlier anatomy, replaced in the site by assets/golem-bombo-cinematic.webp through the nightmare and decayed intermediate edits. Original character specification, based on the supplied book excerpt:

> Use case: stylized-concept. Isolated full-body Bombo, a frightening humanlike male golem returned from the underground gang service, in cinematic psychological science fantasy horror. Gaunt grey human face with old and fresh scars, yellow eyes, exhausted twitching expression, short dark hair, extraordinarily long knotted fingers and pointed nails. Soaked tattered black underground costume, worn trousers and boots. One hand holds a rolled papyrus scroll. A traumatized humanlike being, no stone armor, no literal statue, no skull mask. Quiet menace and convincing practical creature makeup. Soft restrained violet and cold green rim illumination to fit the supplied fantasy terrace. Entire body and fingers visible, transparent background with true alpha, no floor, reflection, environment, text, border or graphic gore.

The quoted generation prompt records this source asset's original specification. Its pose and scroll informed the later edits. Marble remains a passing reflection within the apparition rather than a literal stone statue; the runtime's final glow is violet.

## assets/golem-woman.webp

Final character specification, based on the supplied book excerpt:

> Use case: stylized-concept. Isolated full-body female golem, a deeply unsettling humanlike visitor from an original dark fantasy novel. Long brown hair, thin arms, hands with long nails raised near her chin. Dead grey-green skin with old and fresh scars, restless hollow gaze, subtle facial tension, slightly visible black decayed teeth. Worn grey-green cloak over a ragged costume. A woman initially mistaken for the heroine before her disturbing face becomes apparent. High-quality cinematic psychological horror makeup, anatomically believable, restrained menace, no monster armor, no literal marble body, no decorative skull mask or graphic gore. Soft cold and violet edge illumination matching the site's illustrations. Full figure with generous transparent padding, true alpha, no scene, floor, cast shadow, reflection, text or border.

Used as anatomy for purple portal fog, the tunnel visitor and the distant courtyard apparition. The shader supplies their color, density and flowing silhouette.

## assets/golem-visitor.webp

Preserved earlier concept; no longer used by the site after studying the book excerpt.

Reference: assets/marble.webp, materials and illumination only. Final prompt:

> Use case: stylized-concept. Asset type: isolated transparent full-body creature for compositing on the supplied marble terrace illustration. Create an ORIGINAL deeply unsettling ancient marble golem, cinematic atmospheric science fantasy horror, monumental and uncanny. Tall thin asymmetrical humanoid of polished dark green-black veined marble, eroded funerary mask-like elongated faceless head, small deep hollow eye slits with very faint pale lavender inner light, an unsettling slit in the lower mask, impossibly long articulated arms and fingers held low, a narrow heavy hunched torso partly covered in weathered stone drapery like a ruined cathedral statue. Actual dark marble, restrained gold mineral veins, cracks, wet stone speculars. Menacing quiet presence, no gore. Three-quarter full-body view facing slightly camera-left, both feet flat on the ground. Soft violet rim light from right, weak warm amber edge light from left, matching reference. Entire body including fingers and feet visible, generous padding, centered portrait framing. Transparent background with true alpha, no backdrop, floor, cast shadow, reflection, text or border. One creature, detailed believable practical cinema effects.

## assets/djinn-visitor.webp

Reference: assets/city.webp, lighting and visual style only. Final prompt:

> Use case: stylized-concept. Isolated creature with actual transparent background. One original frightening otherworldly djinn, atmospheric high-budget sci-fi horror creature. Full elongated humanlike figure, enormous ominous quiet presence. Face concealed in a deep folded dark veil, only a vertical narrow hollow where a face should be. Thin unnaturally long fingers emerging from layers of ancient worn charcoal fabric, soot smoke clinging to lower limbs, narrow gaunt shoulders, head bowed slightly toward viewer. Figure hovers upright, lower robe dissolves into restrained semi-transparent wisps. Photoreal cinema creature effects, detailed fabric and mineral dust, uncanny proportions. Soft cold teal rim light with weak gold edge illumination from distant lamps, minimal violet. Full figure visible with generous transparent padding, portrait framing. True alpha, no setting, floor, cast shadow, text, glowing ring, weapons or gore. Match supplied illustration's dark fantasy material quality.

## assets/krishenka-cool-blink.webp and assets/krishenka-warm-blink.webp

Edit targets: corresponding original square portraits. Each portrait was edited separately. Final prompt applied to each portrait with its original cool purple or warm amber illumination:

> Use case: identity-preserve. Produce one precisely registered closed-eyes animation frame. Change ONLY her eyelids: both eyes gently fully closed mid-blink, relaxed, matching realistic eyelid anatomy and original angle. Preserve everything else pixel aligned: exact face identity, facial proportions, head position, nose, mouth, eyebrows, expression, hair, costume, framing, background, original illumination and 1:1 aspect ratio. No head movement, crop, zoom, relighting or makeup change. Suitable as a blink overlay on the original portrait, eye positions exactly aligned. No text.

The renderer uses only feathered eyelid regions from these generated frames. The remainder of the visible face comes from the original portrait, preserving its identity and framing throughout the blink.
