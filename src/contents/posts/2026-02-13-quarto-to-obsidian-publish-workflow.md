---
slug: quarto-to-obsidian-publish-workflow
title: Quarto to Obsidian publish workflow
date: 2026-02-13
disableKatex: true
excerpt: "Render a .qmd note to Markdown, copy figures, and publish cleanly into an Obsidian vault."
tags:
    - python
    - obsidian
    - quarto
---

I often write technical notes as Quarto `.qmd` files in project folders, but I archive and read long-form notes in Obsidian. This post documents a workflow that keeps those two worlds connected:

1. Write and preview in Quarto.
2. Publish into Obsidian as clean Markdown.
3. Copy all referenced figures into a stable vault attachment location.
4. Rewrite image links so Obsidian renders everything correctly.

The goal is simple: keep source notes where the code lives, while maintaining a polished Obsidian knowledge base.

---

## What the workflow does

Given a source file:

`/path/to/project/notes/my_note.qmd`

Publishing produces:

- Rendered note:
  `.../Obsidian Vault/Research/Notes/<TITLE FROM QMD>.md`
- Attachments:
  `.../Obsidian Vault/Attachements & Files/quarto/<qmd-stem>/...`

Image references are rewritten from standard Markdown paths to Obsidian wiki embeds:

- from: `![](my_note_files/figure-commonmark/fig1.png)`
- to: `![[Attachements & Files/quarto/my_note/figure-commonmark/fig1.png]]`

This is important because the attachment folder includes spaces (`Attachements & Files`), and wiki embeds are much more robust in Obsidian.

---

## One-time setup

### Confirm vault paths

- Vault root:
  `/path/to/Obsidian Vault`
- Attachments folder:
  `Attachements & Files`

### Create Quarto attachments subfolder

```bash
VAULT="/path/to/Obsidian Vault"
mkdir -p "$VAULT/Attachements & Files/quarto"
```

### Script

The script is (written by GPT Codex 5.3): 

<script src="https://gist.github.com/anyuzx/5c418f039a21cf073827e4a1f8bcf06e.js"></script>

Modify the line 19-20 according to your path situation. Save script to: `~/bin/publish_quarto_to_obsidian.sh`. Make it executable:

```bash
chmod +x ~/bin/publish_quarto_to_obsidian.sh
```

If `~/bin` is not on your `PATH`:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## Writing the `.qmd` note

Create the note anywhere, for example:

`/path/to/project/notebooks/this_is_a_note.qmd`

Use front matter with a human-readable title:

```yaml
---
title: My note title
format:
  gfm: default
jupyter: python3
---
```

Important:

- `title:` is used as the literal Obsidian filename (`My Nice Title.md`).
- Do not include `/` or `\` in the title.

Then write content normally, including executable code chunks:

````markdown
## Main point
Some text.

```{python}
import matplotlib.pyplot as plt
plt.plot([1,2,3],[1,4,9])
plt.show()
```
````

Quarto may emit assets under `<qmd-stem>_files/figure-commonmark/...`. The publish script resolves referenced images and copies them into your vault attachments automatically.

---

## Publish into Obsidian

Choose a destination path inside the vault, for example:

- `Research/Notes`
- `Research`
- `Personal/Journal`

Then run:

```bash
publish_quarto_to_obsidian.sh "/path/to/this_is_a_note.qmd" "Research/Notes"
```

### What happens during publish

1. Render `.qmd` to GFM Markdown (`--to gfm`) in a temporary folder.
2. Read `title:` from front matter and use it as the output filename.
3. Parse rendered Markdown for image refs (`![](...)` and `<img src="...">`).
4. Resolve images relative to `.qmd` folder first, rendered output folder second.
5. Copy assets to `Attachements & Files/quarto/<qmd-stem>/...`.
6. Rewrite image links to Obsidian embeds (`![[...]]`).
7. Write final note to `.../Obsidian Vault/<DEST>/<TITLE>.md`.
8. Add source marker:
   `<!-- source-qmd: /abs/path/to/this_is_a_note.qmd -->`
9. Remove older generated notes in the same destination that share the same source marker.

---

## Updating an existing note

After editing the `.qmd`, rerun the same publish command:

```bash
publish_quarto_to_obsidian.sh "/path/to/this_is_a_note.qmd" "Research/Notes"
```

Effects:

- The destination Markdown note is refreshed.
- Attachments for that note are recreated.
- If `title:` changed, old generated note is deleted via source marker matching.

