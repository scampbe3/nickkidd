# generate_photos_json.py
# Scans public/portfolio and writes data/photos.json with correct filenames.
from pathlib import Path
import json

ROOT = Path(__file__).parent
public_portfolio = ROOT / "public" / "portfolio"
out_json = ROOT / "data" / "photos.json"

# which file types to include
EXTS = {".jpg", ".jpeg", ".png", ".webp"}

items = []
for f in sorted(public_portfolio.iterdir()):
    if f.is_file() and f.suffix.lower() in EXTS:
        # build an alt from the filename (remove extension, dashes -> spaces)
        alt = f.stem.replace("-", " ")
        # optional: strip a leading "Photo " if present
        if alt.lower().startswith("photo "):
            alt = alt[6:]
        items.append({
            "src": f"/portfolio/{f.name}",  # this is what <img src> uses
            "alt": alt,
            "tags": []                      # fill these later as you like
        })

out_json.parent.mkdir(parents=True, exist_ok=True)
out_json.write_text(json.dumps(items, indent=2), encoding="utf-8")

print(f"Wrote {len(items)} entries to {out_json}")
