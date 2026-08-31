# Authorship and Ownership of lamplight.guide Content

*By Dewayne VanHoozer*

## Why This Existså

Content on lamplight.guide is published under Creative Commons. A CC license only grants what I actually hold copyright in, and US copyright law requires a human author: per the February 2026 Supreme Court non-review of *Thaler*, text produced purely by an AI model, unedited, holds no copyright at all.

I draft essays and studies with the help of multiple large language models from various providers — commercial models such as Claude (Anthropic), and models I have trained privately on my own notes and database content. These are not evidentially equal. Text from a model I trained myself, on my own material, is a tool operating on my own prior work. Text from a commercial third-party model is a tool operating on that provider's training corpus. Since August 2026, some commercial providers embed an imperceptible statistical watermark in their text output as a provenance indicator, one that can persist through editing.

A watermark doesn't affect who owns anything — a provider's terms already assign output rights to me, the user, not to the provider — but it does make third-party AI involvement in a given passage more provable than before. That raises a real question for CC-licensed, publicly attributed work: what evidence shows that I exercised the "meaningful creative control" the Copyright Office requires for a mixed human/AI work to be copyrightable at all?

This document is that evidence: the actual working process behind everything published on this site.

## The Legal Test

The US Copyright Office recognizes three ways AI-assisted material can carry copyright:

1. **Selection** — choosing which AI-generated material to use, and which to discard.
2. **Arrangement** — the structure imposed on that material.
3. **Substantial human revision** — editing that goes beyond superficial correction.

My workflow produces evidence in all three categories, as a byproduct of how this site is built.

## AI Tooling and Provenance Watermarks

Drafting assistance on this site comes from several LLMs, not one:

- **Models I trained privately**, built from my own notes, journal material, and database content. Text from these carries no third-party provenance question — the training material is my own, and any watermark a hosting provider applies to the *serving* of such a model says nothing about the *origin* of the material it was trained on.
- **Commercial third-party models** (Claude and others), trained on each provider's own corpus. Some of these providers now embed an imperceptible statistical watermark in generated text — a pattern in token selection, invisible to a reader, intended as a provenance indicator that can survive some editing.

A watermark is a statistical detector, not a certificate. Such a detector can register a false positive in a narrow domain of discourse — biblical exposition leans on a constrained vocabulary and recurring formulaic phrasing (fixed Scripture wording, repeated theological terms, citation conventions), which can push ordinary human-written text toward the same low-entropy word choices a watermark detector is tuned to flag. A positive reading is evidence of possible AI origin for a passage, not proof of it, and in either direction — present or absent — I do not treat it as evidence of authorship. Authorship is established by the editorial record below.

## Selection: What I Choose to Write

Essay ideas start as raw material in `notes/future_essays.md`, a melting pot of one section per idea. Most never graduate. An idea only becomes its own working notes file once it has enough mass — a thesis, not just a verse or a hunch — and that judgment is mine, made across sessions, not generated in one pass. Selection also happens inside a single note: my working notes for "Just vs. Holy" flag and reject claims an AI research pass got wrong —

> **Abraham** (Genesis 18:25). The original note said Abraham "was described as just because of his plea for the righteous in Sodom." He is not described as just here. He is *appealing to God's* justice.

— selection against the AI's own output, on a factual and textual ground it got wrong.

## Arrangement: My Structural Process

Every essay moves through a named sequence of files, each one a distinct stage I direct, not a single generation collapsed into one step:

1. **Notes** — raw material: verses, quotes, connections, open questions.
2. **Outline** — produced only after the notes have enough shape to organize, and only when I direct it.
3. **Draft** — produced from the outline, after the outline itself has been revised.
4. **Scratch files** — for a specific piece worked in isolation, such as an opening or a closing, when a section needs more attention than the rest.

I keep the staged files side by side rather than overwriting them, so the arrangement decisions at each stage stay visible after the fact, not just in the final draft.

## Substantial Revision: My Style Standard

`STYLE.md` is not a description of what a model happens to produce — it is a standard I impose on every draft, and I revise it over time as I notice new problems across the corpus. Rules I currently enforce:

- **No essay self-reference.** Prose may never say "this essay," "the previous section," or invoke "the reader" as a role — enforced with a literal grep lint pass I run over finished drafts.
- **A banned-phrase list built from the corpus, not a template.** I flagged "doing the arithmetic" after noticing it recurring across three essays and a fourth in progress; I added "hinge" and "shape" (as a verb) for the same reason. Each addition names why — a tic I noticed across multiple drafts — and what to do instead, which only makes sense as a standard I apply by reading across the whole body of work, not something generated per essay.
- **A "Signs of AI Writing to Avoid" section** I maintain specifically because AI-drafted material needs a deliberate pass to catch what an unedited draft would leave in: significance inflation, superficial "-ing" tails, vague attributions, curly quotes. I determine, essay by essay, which patterns are actual instruments of my style — a three-beat enumeration used for rhythm — and which are lazy defaults to cut. That judgment cannot be automated; the test is always intent.

## The Conversation Record

My per-essay notes files carry a running, dated conversation log, written during the work rather than reconstructed afterward, quoting my own words directly. From my notes on "Just vs. Holy":

> **2026-08-25.** Resumed this note after it sat dormant since 2026-07-24... Recommended "A Common Thing in a Set-Apart Room" as title, since it names Isaiah's own "I am undone" (6:5) rather than describing the thesis in the abstract.
>
> > Isaiah 6 it is, go with that title.
>
> Both confirmed. Genesis 18:25 is not dropped...

This is a record of me accepting, rejecting, and redirecting proposed material in my own words, session by session — evidence that editorial judgment was actually exercised, not asserted after the fact.

## Declaration

Within the framework the US Copyright Office has set out for AI-assisted works — copyrightability resting on selection, arrangement, and substantial human revision — I, Dewayne VanHoozer, declare and affirm the following regarding content published on lamplight.guide:

1. The content on this site is substantially my own creation, produced through my editorial workflow, editing practices, and ideation process, as documented above. Where AI tools, mine or third-party, contributed draft material, I selected, arranged, and substantially revised that material before publication.
2. For any content on this site bearing my name as author, I declare and claim ownership of the copyright in that content, to the extent of my authorship as described above.
3. I make that content available for sharing under the terms of the Creative Commons license structure applied to this site, and under no other implied grant.

This declaration does not depend on, and is not defeated by, the presence or absence of a third-party AI provenance watermark in any given passage, for the reasons given above.
