# Case study template — motion and video

Fill this in and it maps directly onto the portfolio's `caseStudy` fields in
`lib/projects.ts`. Leave a section empty rather than inventing it: the site
skips empty sections and shows an editor note in development.

## Overview → `summary`
One or two sentences on what the piece is and who it was for.

## Background → `caseStudy.background`
The client, the product, where the film was going to be seen.

## The challenge → `caseStudy.challenge`
The real constraint. "Explain a technical product in 30 seconds to people who
have never heard of it" is a challenge; "make a great video" is not.

## My role → `role` and `contribution`
Be exact. If you edited but did not shoot, say so. If a partner did the sound
design, name that.

- Concept and storyboard
- Edit and assembly
- Motion graphics
- Colour grade
- Sound design — *or* "sound design by [name]"

## Approach → `caseStudy.approach`
The decisions and why. Pacing, structure, type, palette, the thing you tried
first that did not work.

## Process → `caseStudy.process`
One step per entry: brief, storyboard, animatic, asset production, first cut,
revisions, grade, master, delivery.

## Delivered → `caseStudy.solution`
What the client actually received: durations, aspect ratios, file formats, how
many cutdowns.

## Results → `caseStudy.results`
**Verified outcomes only.** If the client has not shared performance data,
leave this empty. Never write "increased engagement by 40%" without a source
you could show.

Acceptable when unverified: "Delivered on schedule in 16:9, 9:16 and 1:1, with
six social cutdowns."

## Media
Run the pipeline, then put the outputs where the site expects them:

```bash
node scripts/prepare-media.mjs master.mov --slug brand-launch-film --title "Brand Launch Film"
node scripts/contact-sheet.mjs media/brand-launch-film.mp4 --out media/storyboard.jpg --frames 12 --columns 4
```

| Output | Goes to |
| --- | --- |
| `<slug>.mp4` | `public/videos/` |
| `<slug>-preview.mp4` | `public/videos/` |
| `<slug>-poster.jpg` → convert to `.webp` | `public/images/projects/<slug>/poster.webp` |
| `storyboard.jpg` → convert to `.webp` | `public/images/projects/<slug>/storyboard.webp` |

Then paste the JSON the pipeline prints into the project record.
