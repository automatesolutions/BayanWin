---
name: my-tone
description: Jonel's writing voice for BayanWin — UI copy, blog posts, scripts, captions. Use for any user-facing words. Holds voice samples, banned words, and plain-language rules (ASD-STE100, Google developer style, Apple style). Update this file every time the user corrects wording.
user-invocable: true
argument-hint: "[text to rewrite, or what to write]"
---

# /my-tone

Write the way Jonel writes, then check the result against the rules below, top to bottom. Voice first, rule sets second: when a rule set and the voice disagree, the voice wins.

## 1. Voice (from Jonel's own writing)

> **Status: waiting for samples.** Paste five scripts or posts and replace this block with what they show. Until then, use sections 2–5 only and do not invent a personality.

Capture, with a quoted example for each:

- **How I open:** (first line pattern, e.g. question, number, short claim)
- **Sentence length:** (typical word count, how often I use a long one)
- **Words I use:** (recurring words, Taglish terms, how I address the reader: "you", "kayo", "ka")
- **Words I never use:**
- **How I close:** (call to action, sign-off)

Samples (keep 5, newest replaces oldest):

1. _paste_
2. _paste_
3. _paste_
4. _paste_
5. _paste_

## 2. Banned words

Never use these in UI, blog, or captions. Add to the list whenever Jonel rejects a word.

delve, seamless, seamlessly, game-changer, game-changing, unlock, unleash, supercharge, elevate, empower, revolutionary, revolutionize, cutting-edge, state-of-the-art, harness, leverage (as a verb), robust, streamline, synergy, journey (for a product flow), landscape (as in "the lottery landscape"), realm, tapestry, navigate (for anything but navigation), dive in, deep dive, in today's world, it's important to note, at the end of the day, AI-powered (in headlines), guaranteed, sure win, lucky (as a promise), jackpot secret.

_Jonel's additions:_ (none yet)

Also banned: exclamation marks in UI, emoji in headings, "Click here", "Learn more" without an object, "Oops".

## 3. ASD-STE100 Simplified Technical English (adapted)

- One idea per sentence. One topic per paragraph.
- Sentences: 20 words or fewer for instructions, 25 or fewer for explanation.
- Paragraphs: 6 sentences or fewer.
- Active voice. Name who does the action ("The model reads…", not "The history is read…").
- Use the simplest common word with one meaning: "use", not "utilize"; "start", not "initiate"; "help", not "facilitate".
- Use the same word for the same thing every time (a "draw" is always a draw, a "pick" is always a pick; never switch to "result line", "combo", "forecast").
- Instructions start with a verb: "Pick a game." "Enter six numbers."
- Do not join two instructions in one sentence unless they happen at the same time.
- Avoid "-ing" phrases where a plain verb works.

## 4. Google developer documentation style (tone)

- Conversational, friendly, respectful. Like a knowledgeable friend, not a salesperson or a professor.
- Second person: "you". Use "we" only for BayanWin as a team.
- Present tense. Say what happens, not what "will" happen.
- Contractions are fine (don't, it's, you're).
- No hype, no jokes that depend on culture or puns, no exclamation marks.
- Don't tell the reader something is "easy" or "simple".
- Put the condition before the instruction: "To check your ticket, enter six numbers."
- Use sentence case for headings and buttons.

## 5. Apple style guide (UI words)

- Buttons name the action and the object: "Check my numbers", "Run all 7 models". Not "Submit", "OK", "Go".
- Keep labels short; drop articles where it reads naturally.
- Error messages: say what happened, then what to do. No blame ("You entered…" → "Each number can only appear once.").
- Use numerals for numbers (7 models, 6 numbers), including at the start of UI labels.
- Use the en dash for ranges (6/42–6/58) only in display text; use "to" in sentences.
- Time: "9 PM", "Tonight", "Tomorrow". Dates: "Oct 1, 2026".

## 6. BayanWin specifics (always)

- Honest about odds in every surface that mentions picks. Never imply a model raises the chance of winning.
- Literal words people search: "PCSO lotto results", "6/49 result", not clever names.
- Copy rules from competitor research live in `.claude/skills/bayanwin-design/SKILL.md` → "Copy rules". Follow both.

## Updating this skill

Every time Jonel corrects wording (a rejected word, a rewrite, "don't say it like that"):

1. Apply the correction to the current text.
2. Add the lesson here in the right section: a banned word to §2, a voice pattern to §1, a phrasing rule to §6. Quote Jonel's preferred version.
3. Mention in one line that the skill was updated.
