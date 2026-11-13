# Render status — not yet rendered

**No image in this project has been rendered.** The `renders/` directory is
empty on purpose.

## Why

Blender is not available in the environment where this scene was written, and
Cycles needs a GPU to render this shot list in reasonable time. Producing
"renders" by any other means — generating images and presenting them as Blender
output — would misrepresent the work, so nothing was produced.

## What exists and has been checked

| Item | State |
| --- | --- |
| `scenes/build_scene.py` | Written. Parses as valid Python; 20 unit tests pass over the camera maths, presets, angle table and argument parsing. |
| `specs/product-spec.md` | Complete: dimensions, materials, colourways, shot list, lighting plan, output settings. |
| Scene construction in Blender | **Unverified.** The `bpy` calls have not been executed. |
| Materials, lighting, framing | **Unverified.** These need a visual check in Blender. |
| Renders | **None.** |

## What has not been verified, specifically

The script has never run inside Blender, so these are untested:

- That every `bpy.ops` call succeeds on Blender 4.2 and that the operator context is right when run headless.
- That the Principled BSDF socket names match (`Coat Weight` and `Emission Color` were renamed in Blender 4.x; the script guards for their presence but the guard itself is untested).
- That the modelled proportions look correct, rather than merely matching the numbers.
- That the three-point lighting flatters the product at each camera angle.
- That the turntable loops without a visible seam.

Expect to spend an hour adjusting framing and light energies after the first
run. That is normal for a product shoot and is not a defect in the script.

## To render it

```bash
# Build the scene and save a .blend to inspect
blender --background --python scenes/build_scene.py -- \
  --preset studio_white --finish graphite --save-blend renders/aster.blend

# Render the six stills
blender --background --python scenes/build_scene.py -- \
  --preset studio_white --finish graphite --samples 256 --render-stills --out renders/white

# Render the turntable (120 frames — use a GPU)
blender --background --python scenes/build_scene.py -- \
  --preset studio_charcoal --render-turntable --out renders/charcoal

# Encode the turntable
ffmpeg -framerate 30 -i renders/charcoal/turntable/turntable_%04d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 18 renders/aster-turntable.mp4
```

## Then

1. Put the stills in `renders/` and the encoded turntable in the portfolio's `public/videos/`.
2. Add the project to `lib/projects.ts` with `projectType: "Original Concept"`, `status: "Demo Ready"`, and the renders in `gallery`.
3. Replace this file with a short note on what was adjusted after the first render — that is the interesting part of the write-up.

**Until renders exist, this project stays in `PLANNED` in the portfolio.** It is
a prepared scene, not a finished piece of creative work, and listing it as
finished would be a lie.
