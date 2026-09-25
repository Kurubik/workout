#!/usr/bin/env python3
"""Generate the project's own icons from one geometric description.

The mark is original to WORKOUT//INDEX: a barbell built out of the same rails the interface
uses, with a cyan "//" telemetry slash above it. Nothing is copied from the source project's
branding. The SVG (vector favicon) and the PNGs (manifest, apple-touch) are emitted from the
same constants so they cannot drift.

Requires Pillow. Run from the repository root:  python3 scripts/make-icons.py
"""

from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - dev tool
    raise SystemExit('Pillow is required: pip install Pillow')

S = 512
BG = (10, 2, 4, 255)
RAIL = (67, 17, 15, 255)
RAIL2 = (147, 50, 43, 255)
RED = (212, 70, 58, 255)
INK = (236, 227, 216, 255)
CYAN = (90, 214, 210, 255)

# One description, two renderers.
BAR = (116, 288, 396, 312, 8, RED)
PLATES = [
    (140, 232, 188, 368, 14, INK),
    (324, 232, 372, 368, 14, INK),
]
COLLARS = [
    (112, 258, 136, 342, 10, RED),
    (376, 258, 400, 342, 10, RED),
]
SLASHES = [
    [(232, 150), (258, 150), (236, 224), (210, 224)],
    [(276, 150), (302, 150), (280, 224), (254, 224)],
]

OUT = Path(__file__).resolve().parent.parent / 'public'


def svg() -> str:
    def rect(r):
        x0, y0, x1, y1, rad, color = r
        return (f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" '
                f'rx="{rad}" fill="rgb({color[0]},{color[1]},{color[2]})"/>')

    parts = [
        rect(BAR),
        *[rect(r) for r in COLLARS],
        *[rect(r) for r in PLATES],
    ]
    for pts in SLASHES:
        d = ' '.join(f'{x},{y}' for x, y in pts)
        parts.append(f'<polygon points="{d}" fill="rgb({CYAN[0]},{CYAN[1]},{CYAN[2]})"/>')
    body = '\n  '.join(parts)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" role="img" aria-label="WORKOUT//INDEX">
  <rect x="0" y="0" width="{S}" height="{S}" rx="96" fill="rgb({BG[0]},{BG[1]},{BG[2]})"/>
  <rect x="8" y="8" width="{S - 16}" height="{S - 16}" rx="88" fill="none" stroke="rgb({RAIL[0]},{RAIL[1]},{RAIL[2]})" stroke-width="8"/>
  <rect x="20" y="20" width="{S - 40}" height="{S - 40}" rx="78" fill="none" stroke="rgb({RAIL2[0]},{RAIL2[1]},{RAIL2[2]})" stroke-width="2"/>
  {body}
</svg>
'''


def png(size: int) -> Image.Image:
    scale = size / S
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def sc(box):
        return tuple(round(v * scale) for v in box)

    d.rounded_rectangle(sc((0, 0, S, S)), radius=round(96 * scale), fill=BG)
    d.rounded_rectangle(sc((8, 8, S - 8, S - 8)), radius=round(88 * scale), outline=RAIL, width=max(1, round(8 * scale)))
    d.rounded_rectangle(sc((20, 20, S - 20, S - 20)), radius=round(78 * scale), outline=RAIL2, width=max(1, round(2 * scale)))

    for box in COLLARS:
        x0, y0, x1, y1, rad, color = box
        d.rounded_rectangle(sc((x0, y0, x1, y1)), radius=round(rad * scale), fill=color)
    x0, y0, x1, y1, rad, color = BAR
    d.rounded_rectangle(sc((x0, y0, x1, y1)), radius=round(rad * scale), fill=color)
    for box in PLATES:
        x0, y0, x1, y1, rad, color = box
        d.rounded_rectangle(sc((x0, y0, x1, y1)), radius=round(rad * scale), fill=color)
    for pts in SLASHES:
        d.polygon([(round(x * scale), round(y * scale)) for x, y in pts], fill=CYAN)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'icon.svg').write_text(svg(), encoding='utf-8')
    for size, name in ((180, 'icon-180.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
        png(size).save(OUT / name)
        print(f'wrote {name}')
    print('wrote icon.svg')


if __name__ == '__main__':
    main()
