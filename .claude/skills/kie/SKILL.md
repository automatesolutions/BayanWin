---
name: kie
description: Generate images and videos for BayanWin designs through the Kie AI API (Nano Banana, Kling, Veo and other Market models). Use when a design needs a hero image, illustration, background, or short clip. Costs credits per run.
user-invocable: true
argument-hint: "[image|task|status] <prompt or task id>"
---

# /kie — images and videos from Kie AI

Script: `.claude/skills/kie/scripts/kie.py` (Python stdlib, no install). Run from the repo root.

## Setup (once)

1. Get an API key at https://kie.ai (API Keys page).
2. Add `KIE_API_KEY=...` to the repo-root `.env` (gitignored) or export it. Never paste the key into chat, code, or a commit.

## Generate an image

```bash
python .claude/skills/kie/scripts/kie.py image "<prompt>" --aspect 16:9 --out frontend/src/assets/generated/<name>.png
```

- Default model: `google/nano-banana`. Other image models: pass `--model` (see https://kie.ai/market).
- Then convert to WebP for the site (Pillow): keep hero images under ~200 KB.

## Video or any other Market model

```bash
python .claude/skills/kie/scripts/kie.py task --model <model-id> --input '{"prompt": "...", "aspect_ratio": "16:9"}' --out clip.mp4
python .claude/skills/kie/scripts/kie.py status <taskId> --out clip.mp4   # resume a long job
```

Check each model's input fields on its docs page before running (docs.kie.ai/market/...).

## Prompting in the BayanWin style

Read `.claude/skills/bayanwin-design/SKILL.md` first. Every prompt should say:

- Palette: deep ink navy (#0C1119) background, warm orange (#F59331) and electric blue (#3B9EFF) accents only.
- Mood: calm, data-first, editorial. Real light, real materials (lottery balls, paper draw sheets, Manila at night), not neon sci-fi.
- **No text, numbers, or logos in the image** (models garble them). Say "no text" explicitly.
- Never imply winning or money: no cash piles, no celebrating winners, no jackpot fireworks. This is responsible-play content.

## Rules

- Each run spends credits; check prices at https://kie.ai/pricing before a batch. Ask the user before batches larger than 3.
- Result URLs are temporary: always `--out` to save.
- Generated images are decoration only. Give them `alt=""` unless they carry meaning.
