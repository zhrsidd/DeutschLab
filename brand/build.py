"""
Builds DeutschLab's Schwarzrot brand assets from one source of geometry.

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli uharfbuzz
    .venv/bin/python brand/build.py        # run from the repository root

The logomark is pure geometry (below); the wordmark is Bricolage Grotesque
(bundled, SIL OFL) shaped with HarfBuzz and converted to outlines, so no
asset depends on an installed font. See DESIGN.md §2 for construction rules.
"""
import io
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import uharfbuzz as hb

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "brand"
FONT = ROOT / "src/assets/fonts/bricolage-grotesque-normal-latin.woff2"

# ---------- palette (DESIGN.md §3) ----------
OBSIDIAN = "#090909"
CHARCOAL = "#161414"
PAPER = "#F5F1EA"
CRIMSON = "#B52532"
GOLD = "#D6A437"
GOLD_DEEP = "#B0821F"  # gold for paper backgrounds (the light gold disappears on paper)

# ---------- the mark: a 64-unit grid, 12-unit stroke ----------
# Round on the left (bowl, r 24 / 12), square on the right (the stem drops to a
# square foot on the baseline). Dots are circles of the stroke's width, centred
# over the stems, one stroke-width above them.
U_PATH = "M8 22H20V38A12 12 0 0 0 44 38V22H56V62H32A24 24 0 0 1 8 38Z"
DOT_LEFT = (14, 10, 6)
DOT_RIGHT = (50, 10, 6)


def mark(u, left, right, extra=""):
    return (
        f'<path fill="{u}" d="{U_PATH}"/>'
        f'<circle cx="{DOT_LEFT[0]}" cy="{DOT_LEFT[1]}" r="{DOT_LEFT[2]}" fill="{left}"/>'
        f'<circle cx="{DOT_RIGHT[0]}" cy="{DOT_RIGHT[1]}" r="{DOT_RIGHT[2]}" fill="{right}"/>{extra}'
    )


def svg(view_box, body, label):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-label="{label}">\n'
        f"  {body}\n</svg>\n"
    )


# ---------- wordmark outlines ----------
def outline(text, wght, size, x0, baseline, tracking_em):
    font = TTFont(FONT)
    location = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
    location["wght"] = wght
    instance = instantiateVariableFont(font, location)
    instance.flavor = None
    buffer = io.BytesIO()
    instance.save(buffer)
    face = hb.Face(buffer.getvalue())
    shaped = hb.Buffer()
    shaped.add_str(text)
    shaped.guess_segment_properties()
    hb.shape(hb.Font(face), shaped, {"kern": True})
    glyphs = instance.getGlyphSet()
    order = instance.getGlyphOrder()
    scale = size / face.upem
    x = x0
    parts = []
    for info, pos in zip(shaped.glyph_infos, shaped.glyph_positions):
        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        glyphs[order[info.codepoint]].draw(
            TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, baseline - pos.y_offset * scale))
        )
        parts.append(pen.getCommands())
        x += pos.x_advance * scale + tracking_em * size
    return "".join(parts), x - tracking_em * size


def wordmark(x0, baseline, size):
    """'Deutsch' at 700 and 'Lab' at 300: weight contrast, one colour (DESIGN.md §2.4)."""
    deutsch, x = outline("Deutsch", 700, size, x0, baseline, -0.03)
    lab, end = outline("Lab", 300, size, x + size * 0.01, baseline, -0.03)
    return deutsch, lab, end


def main():
    assets = {}
    assets["logomark.svg"] = svg("0 0 64 64", mark(PAPER, CRIMSON, GOLD), "DeutschLab")
    assets["logomark-mono.svg"] = svg("0 0 64 64", mark("currentColor", "currentColor", "currentColor"), "DeutschLab")
    assets["logomark-on-dark.svg"] = svg(
        "0 0 96 96",
        f'<rect width="96" height="96" rx="20" fill="{OBSIDIAN}"/><g transform="translate(16 15)">{mark(PAPER, CRIMSON, GOLD)}</g>',
        "DeutschLab",
    )
    assets["logomark-on-light.svg"] = svg(
        "0 0 96 96",
        f'<rect width="96" height="96" rx="20" fill="{PAPER}"/><g transform="translate(16 15)">{mark(OBSIDIAN, CRIMSON, GOLD_DEEP)}</g>',
        "DeutschLab",
    )

    # Lockup: the U's foot and the text share a baseline (62); cap height ≈ the U's height.
    deutsch, lab, end = wordmark(76, 62, 58)
    width = round(end + 4)
    for name, ink, gold in (("wordmark-lockup.svg", PAPER, GOLD), ("wordmark-lockup-light.svg", OBSIDIAN, GOLD_DEEP)):
        body = mark(ink, CRIMSON, gold) + f'<path fill="{ink}" d="{deutsch}"/><path fill="{ink}" d="{lab}"/>'
        assets[name] = svg(f"0 0 {width} 64", body, "DeutschLab")

    # App icon (macOS grid: 824 px body at 100 px inset, radius 185 on a 1024 canvas).
    # Flat obsidian with one faint warm lift at the top: the silhouette carries it, not lighting.
    s = 8
    tx, ty = 512 - 32 * s, 512 - 33 * s
    icon = (
        '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#1C1817"/><stop offset="1" stop-color="{OBSIDIAN}"/></linearGradient></defs>'
        '<rect x="100" y="100" width="824" height="824" rx="185" fill="url(#bg)"/>'
        '<rect x="101.5" y="101.5" width="821" height="821" rx="183.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="3"/>'
        f'<g transform="translate({tx} {ty}) scale({s})">{mark(PAPER, CRIMSON, GOLD)}</g>'
    )
    assets["app-icon.svg"] = svg("0 0 1024 1024", icon, "DeutschLab")

    for name, content in assets.items():
        (OUT / name).write_text(content)
    print("wrote", ", ".join(assets))


if __name__ == "__main__":
    main()
