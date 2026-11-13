# Product specification — "Aster" desk lamp

The subject of the visualization. A fictional product invented for this
demonstration, specified in enough detail that the model, the renders and any
copy about it all agree.

## Dimensions

| Part | Dimension | Value |
| --- | --- | --- |
| Base | Diameter | 170 mm |
| Base | Height | 18 mm |
| Stem | Diameter | 18 mm |
| Stem | Height | 420 mm |
| Joint | Diameter | 32 mm |
| Head | Outer diameter | 124 mm |
| Head | Aperture diameter | 60 mm |
| Head | Depth | 85 mm |
| Overall | Height (head level) | 497 mm |
| Overall | Weight | 1.9 kg |

## Materials

| Part | Material | Finish | Blender setup |
| --- | --- | --- | --- |
| Base, head | Powder-coated aluminium | Matt, fine texture | Principled BSDF, roughness 0.38, coat weight 0.25 |
| Stem, joint | Brushed stainless | Satin | Metallic 1.0, roughness 0.22 |
| Diffuser | Opal acrylic | Soft glow | Emission strength 14, warm white (2700K equivalent) |

## Colourways

| Name | Body | Hex equivalent |
| --- | --- | --- |
| Graphite | Near-black warm grey | `#0E0F10` |
| Sand | Warm pale beige | `#C7B89E` |
| Sage | Muted green | `#6B8570` |

Pass with `--finish graphite|sand|sage`.

## Shot list

| # | Angle | Purpose | Focal | f-stop |
| --- | --- | --- | --- | --- |
| 1 | Hero three-quarter | Primary listing image | 85 mm | f/8 |
| 2 | Front elevation | Specification and scale reference | 105 mm | f/8 |
| 3 | Profile left | Silhouette and reach | 85 mm | f/8 |
| 4 | Top down | Base footprint | 50 mm | f/8 |
| 5 | Detail — shade | Material and aperture | 135 mm | f/4 |
| 6 | Detail — base | Joint and finish quality | 135 mm | f/4 |

Plus a 120-frame turntable (4 seconds at 30fps, 5 at 24fps, loops cleanly).

## Lighting

Three-point, with the product lit rather than the backdrop:

- **Key** — 1.1 m area light, upper front left, 48° down.
- **Fill** — 1.6 m area light, front right, roughly a quarter of the key's strength, to open the shadows without flattening the form.
- **Rim** — 0.5 m area light, high behind, to separate the silhouette from the backdrop.
- **World ambient** — low, to keep the shadows from going black.

Energies change per backdrop preset: a charcoal backdrop needs a stronger rim
and less ambient than a white one.

## Backdrop presets

| Preset | Use |
| --- | --- |
| `studio_white` | E-commerce listings, catalogue |
| `studio_charcoal` | Hero banner, premium framing |
| `warm_desk` | Lifestyle context, warmer palette |

## Output

- Stills: 2000 × 2500 px (4:5), PNG, Cycles, 256 samples with denoising, AgX view transform.
- Turntable: 120 frames at the same resolution, rendered as a PNG sequence and encoded afterwards.
