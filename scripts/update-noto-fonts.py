#!/usr/bin/env python3
"""Refresh pinned CJK fallbacks and compact common fonts (npm + fontTools/Brotli)."""

import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile
import urllib.request

import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/assets/fonts/noto"
VERSION = "5.3.1"
FAMILIES = {"sans": "Noto Sans SC", "serif": "Noto Serif SC"}
GOOGLE_COMMIT = "47d54ca1ebb14fd864695f1d39dc734f39017c33"
SOURCE_HASHES = {
    "sans": "a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da",
    "serif": "050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9",
}


def unicode_points(value):
    points = set()
    for part in value.split(","):
        start, *end = part.strip()[2:].split("-")
        points.update(range(int(start, 16), int(end[0], 16) + 1)
                      if end else [int(start, 16)])
    return points


def unicode_ranges(points):
    ranges = []
    for point in sorted(points):
        if ranges and ranges[-1][1] + 1 == point:
            ranges[-1][1] = point
        else:
            ranges.append([point, point])
    return ",".join(f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}"
                    for start, end in ranges)


def content_characters():
    """Read local content; no generated HTML or live remote data is required."""
    prose, headings = [], []

    def json_strings(value):
        if isinstance(value, str):
            prose.append(value)
        elif isinstance(value, list):
            for item in value:
                json_strings(item)
        elif isinstance(value, dict):
            for key, item in value.items():
                # Photo captions appear as h1 on individual photo pages.
                if key in ("title", "caption") and isinstance(item, str):
                    headings.append(item)
                json_strings(item)

    for path in sorted((ROOT / "src").rglob("*")):
        if OUTPUT in path.parents or path.suffix not in (
            ".md", ".njk", ".html", ".json", ".yml", ".yaml", ".js"
        ):
            continue
        text = path.read_text(encoding="utf-8")
        prose.append(text)
        if path.suffix == ".json":
            json_strings(json.loads(text))
        headings.extend(re.findall(r"^#{1,6}\s+(.+)$", text, re.M))
        headings.extend(re.findall(r"^title:\s*(.+)$", text, re.M))
        headings.extend(re.findall(r"<h[1-6]\b[^>]*>(.*?)</h[1-6]>", text, re.S))
    return {"sans": set(map(ord, "".join(prose))),
            "serif": set(map(ord, "".join(headings)))}


def common_font(kind, family, characters):
    base = f"https://raw.githubusercontent.com/google/fonts/{GOOGLE_COMMIT}/ofl/noto{kind}sc"
    url = f"{base}/Noto{kind.title()}SC%5Bwght%5D.ttf"
    source_bytes = urllib.request.urlopen(url).read()
    if hashlib.sha256(source_bytes).hexdigest() != SOURCE_HASHES[kind]:
        raise ValueError(f"Source font checksum mismatch: {url}")
    font = TTFont(io.BytesIO(source_bytes), recalcTimestamp=False)
    number = 3 if kind == "sans" else 4
    latin = TTFont(ROOT / f"src/_includes/fonts/source-{kind}-{number}-variable.woff2")
    points = (characters - set(latin.getBestCmap())) & set(font.getBestCmap())
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=points)
    subsetter.subset(font)
    font.flavor = "woff2"
    output = io.BytesIO()
    font.save(output)
    data = output.getvalue()
    actual_points = set(font.getBestCmap())
    if not points <= actual_points:
        raise ValueError(f"Common font lost characters: {family}")
    axis = next(axis for axis in font["fvar"].axes if axis.axisTag == "wght")
    weights = f"{axis.minValue:g} {axis.maxValue:g}"
    digest = hashlib.sha256(data).hexdigest()
    filename = f"noto-{kind}-sc-common.{digest[:12]}.woff2"
    ranges = unicode_ranges(points)
    css = (f"/* Common current-site characters; full variable weight axis. */\n"
           f"@font-face {{\n  font-family: '{family}';\n  font-style: normal;\n"
           f"  font-display: swap;\n  font-weight: {weights};\n"
           f"  src: url('./{filename}') format('woff2');\n"
           f"  unicode-range: {ranges};\n}}")
    details = {
        "file": filename, "bytes": len(data), "sha256": digest,
        "characterCount": len(points), "unicodeRange": ranges,
        "sourceUrl": url, "sourceSha256": SOURCE_HASHES[kind],
        "sourceCommit": GOOGLE_COMMIT, "fontToolsVersion": fontTools.__version__,
        "weightAxis": {"min": axis.minValue, "max": axis.maxValue},
    }
    license_bytes = urllib.request.urlopen(f"{base}/OFL.txt").read()
    return filename, data, points, css, details, license_bytes


def main():
    generated = {}
    stylesheet = [
        "/* Generated by scripts/update-noto-fonts.py. */",
        "/* Fontsource variable CJK subsets; SIL Open Font License 1.1. */",
        "/* Latin text is supplied by the site's Adobe Source fonts. */",
        "",
    ]
    manifest = {"fontsourceVersion": VERSION, "families": {}}
    characters = content_characters()
    with tempfile.TemporaryDirectory(prefix="prongs-noto-") as temporary:
        for kind, family in FAMILIES.items():
            common_name, common_data, common_points, common_css, common_details, license_bytes = common_font(
                kind, family, characters[kind]
            )
            generated[common_name] = common_data
            generated[f"LICENSE-common-{kind}.txt"] = license_bytes
            stylesheet.extend([common_css, ""])
            package_id = f"@fontsource-variable/noto-{kind}-sc"
            subprocess.run(
                ["npm", "pack", f"{package_id}@{VERSION}", "--silent",
                 "--pack-destination", temporary],
                check=True, capture_output=True, text=True,
            )
            archive = Path(temporary) / f"fontsource-variable-noto-{kind}-sc-{VERSION}.tgz"
            with tarfile.open(archive) as package:
                def read(member):
                    return package.extractfile(f"package/{member}").read()

                metadata = json.loads(read("metadata.json"))
                original_css = read("wght.css").decode("utf-8")
                faces = re.findall(r"/\*[^*]*\*/\s*@font-face\s*\{[^}]+\}", original_css)
                files = []
                for face in faces:
                    match = re.search(r"url\(\./files/(noto-.*?)-(\d+)-wght-normal\.woff2\)", face)
                    # Numbered subsets retain all supplied CJK coverage and punctuation.
                    # Latin, Latin-ext, Cyrillic and Vietnamese subsets remain in Source.
                    if not match:
                        continue
                    original_name = f"{match[1]}-{match[2]}-wght-normal.woff2"
                    data = read(f"files/{original_name}")
                    if data[:4] != b"wOF2":
                        raise ValueError(f"Not a WOFF2 font: {original_name}")
                    digest = hashlib.sha256(data).hexdigest()
                    filename = f"{Path(original_name).stem}.{digest[:12]}.woff2"
                    face = face.replace(f"'{family} Variable'", f"'{family}'")
                    face = face.replace(f"./files/{original_name}", f"./{filename}")
                    face = face.replace("format('woff2-variations')", "format('woff2')")
                    original_range = re.search(r"unicode-range:\s*([^;]+);", face)[1]
                    fallback_range = unicode_ranges(unicode_points(original_range) - common_points)
                    face = face.replace(original_range, fallback_range)
                    if fallback_range:
                        stylesheet.extend([face, ""])
                    files.append({
                        "source": original_name, "file": filename,
                        "bytes": len(data), "sha256": digest,
                        "unicodeRange": fallback_range,
                        "originalUnicodeRange": original_range,
                    })
                if not files:
                    raise ValueError(f"No CJK subsets found in {package_id}")
                generated[f"LICENSE-{kind}.txt"] = read("LICENSE")
                manifest["families"][family] = {
                    "package": package_id, "version": VERSION,
                    "upstreamVersion": metadata["version"],
                    "archiveSha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
                    "weightAxis": metadata["variable"]["wght"],
                    "common": common_details,
                    "files": files,
                }

    generated["fonts.css"] = "\n".join(stylesheet).encode("utf-8")
    generated["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, data in generated.items():
        (OUTPUT / name).write_bytes(data)
    for stale in OUTPUT.glob("noto-*.woff2"):
        if stale.name not in generated:
            stale.unlink()
    for family, details in manifest["families"].items():
        files = details["files"]
        print(f"{family}: {len(files)} subsets, {sum(f['bytes'] for f in files):,} bytes")
        print(f"  Common: {details['common']['characterCount']} characters, {details['common']['bytes']:,} bytes")
    print(f"Stylesheet: {len(generated['fonts.css']):,} bytes")


if __name__ == "__main__":
    main()
