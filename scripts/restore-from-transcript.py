#!/usr/bin/env python3
"""Reconstruct nj-stem-player-web files from Cursor agent transcript JSONL."""
import json
import os
import re
import sys
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\Athony\.cursor\projects\c-Users-Athony-cursor-projects-empty-window-nj-stem-player-web"
    r"\agent-transcripts\c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26\c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26.jsonl"
)
OUT_ROOT = Path(r"C:\Users\Athony\.cursor\projects\empty-window\nj-stem-player-web")

# Normalize paths to project-relative
PATH_MARKERS = [
    r"C:\Users\Athony\.cursor\projects\empty-window\nj-stem-player-web",
    r"C:/Users/Athony/.cursor/projects/empty-window/nj-stem-player-web",
    r"e:\1 - Work\NJ Stem Player\nj-stem-player-web",
    r"G:/1 - Work/NJ Stem Player",
    r"G:/1 - Work/NJ Stem Player/nj-stem-player-web",
    r"E:/1 - Work/NJ Stem Player/nj-stem-player-web",
]


def normalize_path(raw: str) -> str | None:
    p = raw.replace("\\", "/")
    for marker in PATH_MARKERS:
        m = marker.replace("\\", "/")
        if p.lower().startswith(m.lower()):
            rel = p[len(m) :].lstrip("/")
            return rel
    if "nj-stem-player-web/" in p.lower():
        idx = p.lower().index("nj-stem-player-web/")
        return p[idx + len("nj-stem-player-web/") :]
    return None


def apply_str_replace(content: str, old: str, new: str, path: str) -> str:
    if old not in content:
        # try normalized newlines
        old_n = old.replace("\r\n", "\n")
        c_n = content.replace("\r\n", "\n")
        if old_n in c_n:
            return c_n.replace(old_n, new.replace("\r\n", "\n"), 1)
        print(f"WARN: StrReplace old_string not found in {path}", file=sys.stderr)
        return content
    return content.replace(old, new, 1)


def main() -> None:
    files: dict[str, str] = {}
    write_count = 0
    replace_count = 0
    skipped = 0

    with TRANSCRIPT.open(encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            msg = row.get("message") or {}
            content = msg.get("content")
            if not isinstance(content, list):
                continue
            for block in content:
                if not isinstance(block, dict) or block.get("type") != "tool_use":
                    continue
                name = block.get("name")
                inp = block.get("input") or {}
                raw_path = inp.get("path")
                if not raw_path:
                    continue
                rel = normalize_path(str(raw_path))
                if not rel:
                    skipped += 1
                    continue
                rel = rel.replace("\\", "/")

                if name == "Write":
                    contents = inp.get("contents")
                    if contents is None:
                        continue
                    files[rel] = contents
                    write_count += 1
                elif name == "StrReplace":
                    old = inp.get("old_string")
                    new = inp.get("new_string")
                    if old is None or new is None:
                        continue
                    if rel not in files:
                        print(f"WARN: StrReplace before Write for {rel} (line {line_no})", file=sys.stderr)
                        continue
                    files[rel] = apply_str_replace(files[rel], old, new, rel)
                    replace_count += 1

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    written = 0
    for rel, content in sorted(files.items()):
        out = OUT_ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(content, encoding="utf-8", newline="\n")
        written += 1

    print(f"Writes applied: {write_count}")
    print(f"StrReplaces applied: {replace_count}")
    print(f"Skipped paths (non-project): {skipped}")
    print(f"Files written: {written}")
    print(f"Output: {OUT_ROOT}")
    # list top-level
    for p in sorted(files.keys())[:5]:
        print(f"  sample: {p}")
    print("  ...")
    for p in sorted(files.keys())[-5:]:
        print(f"  sample: {p}")


if __name__ == "__main__":
    main()
