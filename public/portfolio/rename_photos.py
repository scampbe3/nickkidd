# rename_photos.py
# Usage (from this folder):  python rename_photos.py
# Optional preview:          python rename_photos.py --dry-run

from pathlib import Path
import argparse
import sys

def sanitize(name: str) -> str:
    # remove commas, replace spaces with dashes; keep everything else as-is
    return name.replace(",", "").replace(" ", "-")

def main(dir_path: str, dry_run: bool) -> None:
    p = Path(dir_path)
    if not p.is_dir():
        print(f"Not a directory: {p}")
        sys.exit(1)

    changes = []
    for f in p.iterdir():
        if not f.is_file():
            continue
        new_name = sanitize(f.name)
        if new_name == f.name:
            continue

        target = f.with_name(new_name)
        # avoid overwriting existing files
        if target.exists():
            stem, suffix = target.stem, target.suffix
            i = 1
            while target.exists():
                target = f.with_name(f"{stem}-{i}{suffix}")
                i += 1

        changes.append((f, target))

    if not changes:
        print("Nothing to rename.")
        return

    for src, dst in changes:
        print(f"{src.name} -> {dst.name}")

    if dry_run:
        print("\nDry run only. Re-run without --dry-run to apply.")
        return

    for src, dst in changes:
        src.rename(dst)

    print(f"\nRenamed {len(changes)} file(s).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rename photos: remove commas, replace spaces with dashes.")
    parser.add_argument("directory", nargs="?", default=".", help="Folder to process (default: current folder)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without renaming")
    args = parser.parse_args()
    main(args.directory, args.dry_run)
