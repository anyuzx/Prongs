# Source font delivery

The original Adobe Source Sans 3 (normal/italic) and Source Serif 4 variable
WOFF2 files and their licenses are retained unchanged. The site loads smaller
Latin-1, combining-accent, and prose-punctuation subsets for ordinary text.
The Unicode ligatures U+FB00–FB04 are included for Typeset's literal fi/fl output.
Disjoint `unicode-range` declarations send all other original characters to
the original files, preserving the full character repertoire.

The generated subsets retain the original weight axes and Source Serif 4's
optical-size axis, outlines, hinting, and default shaping/kerning/ligatures.
Tabular digit widths are preserved for the site's dates and tables. The `tnum`
feature is requested; it may be pruned when the retained digits are already
tabular and its optional source glyphs are absent. Small caps (`smcp`, `c2sc`)
used by Typeset and slashed zero (`zero`) are retained when available. Other optional display
alternates are omitted from these small delivery files; if the design later
uses additional OpenType features, add them to the maintenance script before
regenerating. Selecting an optional feature alone does not load the full font.

The subset files' internal family identifiers are `Prongs Sans Web` and
`Prongs Serif Web` because Adobe reserves the name `Source` for original fonts.
The CSS aliases remain `Source Sans 3` and `Source Serif 4`; the appearance does
not change. Copyright, attribution, trademark, and license metadata are kept.

`delivery-manifest.json` records original and generated checksums, sizes,
Unicode ranges, and original variable axes. Hashed filenames prevent stale
font cache entries. Preload only the normal Latin body and heading files;
italic and extended-script files are requested when used.

## Regenerate

This maintenance operation requires Python `fonttools[woff]==4.61.1` and
`brotli==1.2.0`; production builds have no Python dependency.

```sh
python3 scripts/optimize-site-fonts.py
```

The script also maintains the tiny Chinese-name subset. Updating Noto fonts
with `scripts/update-noto-fonts.py` runs this delivery optimization afterward.
The site's font delivery data reads preload URLs from the generated manifest,
so changes to hashed filenames do not require hardcoded layout updates.
