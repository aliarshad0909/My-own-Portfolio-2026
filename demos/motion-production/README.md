# Motion graphics and video production

The production tooling and case-study structure for Ali's motion work.

Project 09 of the portfolio expansion.

> **No finished video is in this repository.** Ali's footage, renders and
> finished edits have not been supplied, and nothing has been generated to
> stand in for them. What is here is the pipeline that prepares real footage
> for the site, verified by running it on a generated test clip.

## What is actually working

Two command-line tools, both exercised by tests that really invoke ffmpeg.

### `prepare-media.mjs`

Takes one master file and produces everything the portfolio needs:

| Output | What it is | Why |
| --- | --- | --- |
| `<slug>.mp4` | H.264, up to 1920px, CRF 21, faststart | The playable file. Faststart puts the index first so playback starts before the download finishes. |
| `<slug>.webm` | VP9, CRF 32 | Smaller where supported. |
| `<slug>-preview.mp4` | 960px, 6s, 24fps, **silent** | The hover preview on project cards. A preview that makes noise on hover is a bug, so audio is stripped unconditionally. |
| `<slug>-poster.jpg` | Frame at 25% in | Poster image. A quarter in, because the first frame is usually black or a fade-up. |

It never upscales past the source, keeps dimensions even (both codecs require
it), drops the audio track when the source is silent rather than failing, and
prints the JSON snippet to paste into `lib/projects.ts` with the poster's real
dimensions already filled in.

```bash
node scripts/prepare-media.mjs master.mov --slug brand-launch-film --title "Brand Launch Film"
```

### `contact-sheet.mjs`

Builds a storyboard contact sheet — evenly spaced frames in a grid — for the
"storyboard frames" part of a case study. Frames are inset from both ends so
slates and fade-ups are skipped.

```bash
node scripts/contact-sheet.mjs film.mp4 --out storyboard.jpg --frames 12 --columns 4
```

## Templates

- `templates/shot-list.md` — shots, motion-graphics beats, audio with a **licence column**, and a version log. Music cleared for personal use is not cleared for a client's advertising, and that catches people out.
- `templates/case-study.md` — maps section by section onto the portfolio's `caseStudy` fields, with a reminder that `results` takes verified outcomes only.

## Tests

```bash
npm test     # 28 tests
```

ffmpeg genuinely encodes during these runs and ffprobe genuinely inspects the
results.

| Group | Covers |
| --- | --- |
| Probe | Dimensions, duration, frame rate, codecs, audio presence; rejects a file with no video stream. |
| Arguments | Never upscaling, even dimensions, faststart, audio kept or dropped to match the source, preview always silent, preview length capped and the opening second skipped on long clips. |
| Poster timing | A quarter of the way in, never the first frame of a short clip, explicit timestamps clamped inside the clip, unknown durations handled. |
| Full pipeline | All four outputs non-empty, H.264 and VP9 confirmed by probe, preview shorter, silent and lighter than the master, poster at the source aspect ratio, snippet paths and real poster dimensions, malformed slugs rejected (including `../escape`), and a silent source handled. |
| Contact sheet | Even spacing with end insets, single-frame case, grid geometry, and a real rendered sheet checked for dimensions and codec. |

**What the tests do not prove:** anything about Ali's actual footage, or that
the encoding settings suit a particular piece of work. CRF 21 is a sensible
default for motion graphics; heavy grain or fast motion may want a lower
number.

## When the footage arrives

1. Run `prepare-media.mjs` on each master.
2. Run `contact-sheet.mjs` for the storyboard frames.
3. Convert the poster and sheet to WebP and drop them in `public/images/projects/<slug>/`.
4. Put the MP4s in `public/videos/`.
5. Paste the printed snippet into `lib/projects.ts`, fill in the case study from the template, and move the entry out of `PLANNED` into `PROJECTS`.

The portfolio already supports this end to end: `ProjectMedia` plays hover
previews muted and only when the visitor has not asked for reduced motion, and
`MediaGallery` renders full videos with controls and `preload="none"`.

## Note on AI-generated video

None is used here and none should be. Presenting generated footage as client
work, or as Ali's own production, would misrepresent the craft this project
exists to demonstrate.
