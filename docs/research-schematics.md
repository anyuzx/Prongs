# Homepage schematics

Extracted from Guang Shi's `Past_Research_Contributions_GS_2026_1page_v2.pdf` (Figures 1–2). Scientific content is unchanged; the original captions are presented as shorter HTML captions on the homepage.

- `hipps-dimes.jpg`: original embedded Figure 1, 3750 × 1313. Responsive WebP versions at 400, 800, 1200, and 1600px let the browser choose the appropriate resolution.
- `condensates.png`: original embedded Figure 2, 1739 × 332, with its PDF alpha mask restored. Lossless WebP versions at 400, 800, 1200, and the original 1739px preserve its transparency and diagram details.

Images have explicit dimensions, descriptive alternative text, and native lazy loading. The schematic images render on a white CSS background so transparent regions blend with the white subfigures. Captions are plain text without full-size links.

The 400px, 800px, and 1200px variants were generated with `cwebp -m 6 -resize WIDTH 0`, using `-q 90 -sharp_yuv` for HIPPS-DIMES and `-lossless` for condensates. The `sizes` attribute follows the page's 768px maximum content width and 16px side margins.
