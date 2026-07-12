#!/usr/bin/env python3
"""Extract R + G outlines from Big Shoulders Display 900 and compose the RG favicon SVG."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

FONT = "node_modules/@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff"

font = TTFont(FONT)
glyphset = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font["head"].unitsPerEm

def glyph_path(ch):
    name = cmap[ord(ch)]
    pen = SVGPathPen(glyphset)
    glyphset[name].draw(pen)
    return pen.getCommands(), glyphset[name].width

r_path, r_w = glyph_path("R")
g_path, g_w = glyph_path("G")
asc = font["hhea"].ascent
desc = font["hhea"].descent
cap = font["OS/2"].sCapHeight if hasattr(font["OS/2"], "sCapHeight") else asc
print(f"upm={upm} capHeight={cap} R width={r_w} G width={g_w}")

# Font coords are y-up; SVG is y-down: flip with scale(1,-1) translate.
# G drawn first, R painted on top so the R keeps its full silhouette
# (the G only loses a sliver of its left stem). Near-full-bleed tile.
OVERLAP = int(0.12 * r_w)
total_w = r_w + g_w - OVERLAP

CANVAS = int(cap * 1.18)
x_off = (CANVAS - total_w) / 2
y_off = (CANVAS - cap) / 2 + cap  # baseline position from top

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}">
  <rect width="{CANVAS}" height="{CANVAS}" fill="#0a0b09"/>
  <g transform="translate({x_off:.0f},{y_off:.0f}) scale(1,-1)">
    <path transform="translate({r_w - OVERLAP},0)" d="{g_path}" fill="#a8f53e"/>
    <path d="{r_path}" fill="#e9e7da"/>
  </g>
</svg>'''

out = "public/favicon.svg"
with open(out, "w") as f:
    f.write(svg)
print(f"wrote {out} canvas={CANVAS} total_w={total_w} overlap={OVERLAP}")
