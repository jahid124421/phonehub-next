#!/usr/bin/env python3
"""Generate local placeholder art for products without real imagery.

Monitors and routers previously pointed at picsum.photos (random stock
photos — a mountain for a router, a VW bus for a monitor). This generates
consistent, on-brand SVG placeholders and rewrites the JSON data so
`image` is empty (ProductImage renders `fallbackImg` immediately).
"""
import json
import os
import html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GRAD_TOP = "#f3f6fb"
GRAD_BOTTOM = "#dbe2ee"
INK = "#3c4763"
MUTED = "#7a869f"
BODY = "#c3cde0"
STROKE = "#9fb0cc"


def wrap_name(name: str, max_chars: int = 20):
    words = name.split()
    lines = []
    cur = ""
    for w in words:
        if not cur:
            cur = w
        elif len(cur) + 1 + len(w) <= max_chars:
            cur += " " + w
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    if len(lines) > 2:
        lines = lines[:2]
        lines[1] = lines[1][: max_chars - 1].rstrip() + "…"
    return lines


def monitor_art() -> str:
    # screen + stand
    return (
        f'<rect x="70" y="96" width="260" height="150" rx="14" fill="{BODY}" stroke="{STROKE}" stroke-width="3"/>'
        f'<rect x="84" y="110" width="232" height="122" rx="8" fill="#ffffff" opacity="0.55"/>'
        f'<rect x="182" y="252" width="36" height="26" fill="{BODY}" stroke="{STROKE}" stroke-width="3"/>'
        f'<rect x="140" y="278" width="120" height="14" rx="7" fill="{BODY}" stroke="{STROKE}" stroke-width="3"/>'
    )


def router_art() -> str:
    # antennas + body + LEDs
    return (
        f'<rect x="118" y="88" width="14" height="90" rx="7" fill="{BODY}" stroke="{STROKE}" stroke-width="3"/>'
        f'<rect x="268" y="88" width="14" height="90" rx="7" fill="{BODY}" stroke="{STROKE}" stroke-width="3"/>'
        f'<rect x="86" y="170" width="228" height="72" rx="18" fill="{BODY}" stroke="{STROKE}" stroke-width="3"/>'
        f'<circle cx="130" cy="206" r="7" fill="#ffffff" opacity="0.8"/>'
        f'<circle cx="156" cy="206" r="7" fill="#ffffff" opacity="0.8"/>'
        f'<circle cx="182" cy="206" r="7" fill="#ffffff" opacity="0.8"/>'
    )


def make_svg(name: str, brand: str, kind: str) -> str:
    art = monitor_art() if kind == "monitors" else router_art()
    lines = wrap_name(name)
    if len(lines) == 1:
        text = (
            f'<text x="200" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="21" '
            f'font-weight="600" fill="{INK}" text-anchor="middle">{html.escape(lines[0])}</text>'
        )
    else:
        text = (
            f'<text font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="600" '
            f'fill="{INK}" text-anchor="middle">'
            f'<tspan x="200" y="318">{html.escape(lines[0])}</tspan>'
            f'<tspan x="200" y="344">{html.escape(lines[1])}</tspan></text>'
        )
    initial = html.escape((brand or name or "?")[0].upper())
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{GRAD_TOP}"/>
      <stop offset="1" stop-color="{GRAD_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  {art}
  <circle cx="200" cy="200" r="26" fill="{INK}" opacity="0.85"/>
  <text x="200" y="208" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" text-anchor="middle">{initial}</text>
  {text}
  <text x="200" y="374" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="{MUTED}" text-anchor="middle">{kind[:-1]} · product art</text>
</svg>
"""


def process(json_name: str, kind: str) -> None:
    path = os.path.join(ROOT, "src", "data", json_name)
    with open(path) as f:
        items = json.load(f)
    out_dir = os.path.join(ROOT, "public", "img", kind)
    os.makedirs(out_dir, exist_ok=True)

    changed = 0
    for item in items:
        img = item.get("image") or ""
        if "picsum.photos" in img or not img:
            fname = f"{item['id']}.svg"
            with open(os.path.join(out_dir, fname), "w") as f:
                f.write(make_svg(item["name"], item.get("brand", ""), kind))
            item["image"] = ""
            item["fallbackImg"] = f"img/{kind}/{fname}"
            changed += 1

    with open(path, "w") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"{json_name}: {changed} placeholders written to public/img/{kind}/")


def clean_news() -> None:
    path = os.path.join(ROOT, "src", "data", "news.json")
    with open(path) as f:
        items = json.load(f)
    changed = 0
    for item in items:
        if "picsum.photos" in (item.get("image") or ""):
            item["image"] = ""  # NewsImage renders its branded placeholder
            changed += 1
    with open(path, "w") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"news.json: {changed} picsum URLs cleared (branded placeholder renders instead)")


if __name__ == "__main__":
    process("monitors.json", "monitors")
    process("routers.json", "routers")
    clean_news()
