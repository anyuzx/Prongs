# Chinese web fonts

The site uses three layers of normal-style, variable-weight Chinese fonts:

1. A tiny `时光` subset lets the English biography load only the two Chinese
   characters it uses, instead of the entire article character set.
2. Small common-character fonts cover current body text and headings. They are
   generated from the full official Google Fonts variable TTF sources at commit
   `47d54ca1ebb14fd864695f1d39dc734f39017c33`, using fontTools and Brotli.
3. Numbered CJK WOFF2 subsets from Fontsource **5.3.1** provide automatic fallback
   for future text that uses characters outside the common sets:

- `@fontsource-variable/noto-sans-sc` (Google Fonts version v41), weight axis 100–900.
- `@fontsource-variable/noto-serif-sc` (Google Fonts version v36), weight axis 200–900.

The fallback font bytes are unchanged from the packages. They are copied from
the installed Fontsource packages into `dist/assets/fonts/noto` by
`src/utilities/build/copyChineseFonts.js` during the build; the 194 upstream
binaries do not need to be checked into this directory.

The CSS uses the family aliases `Noto Sans SC` and `Noto Serif SC`, relative
content-hashed URLs, and `font-display: swap`. Common characters are removed from
the fallback faces' `unicode-range` declarations, so existing pages load the
small common fonts without also requesting the larger fallback chunks. The
name's two characters are likewise excluded from the common face's range. The
original and adjusted ranges are recorded in the manifest. All common and
fallback fonts preserve their full weight axis, including genuine 400, 500,
600, and 700 weights.

All numbered CJK subsets are retained in the build, including Chinese punctuation
and rare characters covered by the upstream fonts. Future posts continue to work
without regenerating the common fonts. Separate Latin, Latin Extended, Cyrillic,
and Vietnamese files are omitted because the site's Adobe Source fonts handle
those scripts. Do not preload or precache the entire font directory.

The build's `inlineChineseFonts` transform replaces the Noto stylesheet link
with only the font-face rules whose ranges intersect rendered page text. It
decodes entities, excludes scripts/styles/head metadata, includes hidden
excerpts, and makes asset URLs absolute. English-only pages receive no Noto
rules, and pages do not wait for the full external stylesheet. Some unused
family rules may remain; browsers still request only fonts used to render text.

The `LICENSE-*.txt` files contain the original SIL Open Font License and copyright
notices for both source distributions. `manifest.json` records package versions,
archive checksums, pinned source URLs, original filenames, font checksums, sizes,
weight axes, fontTools version, and Unicode ranges.

## Refresh

To refresh the optimization after adding content, install Python's `fonttools`
and `brotli` packages, then run from the repository root:

```sh
python3 scripts/update-noto-fonts.py
```

The script collects body characters from local source content, and heading
characters from Markdown headings, page titles, HTML headings, and JSON photo
captions/titles. Characters already covered by the site's Adobe Source fonts
are omitted. The script uses `npm pack` to inspect the pinned fallback packages;
it does not alter `package.json` or the lockfile. It writes the two common
font binaries, CSS, manifest, and licenses, then runs
`scripts/optimize-site-fonts.py` to restore the name subset and delivery ranges.

To adopt a new Fontsource release, update `VERSION` in the script and the pinned
project dependencies together. Source TTF URLs and checksums are pinned
separately. Regenerate, run the production build, and check Chinese body text,
headings, punctuation, and font requests before committing.

## Sources

- https://www.npmjs.com/package/@fontsource-variable/noto-sans-sc
- https://www.npmjs.com/package/@fontsource-variable/noto-serif-sc
- https://fontsource.org/fonts/noto-sans-sc
- https://fontsource.org/fonts/noto-serif-sc
- https://github.com/google/fonts/tree/main/ofl/notosanssc
- https://github.com/google/fonts/tree/main/ofl/notoserifsc
