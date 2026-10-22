"""Backfill harmony in song JSON. Dry run unless --write; changed files are backed up."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app import validate_song
from harmonizer import harmonize_song


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directories', type=Path, nargs='*',
                        default=[ROOT / 'data/songs', ROOT / 'data/trials/musicxml'])
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    changes = []
    # Validate the complete batch before touching any source file.
    for directory in args.directories:
        if not directory.is_dir():
            parser.error(f'Not a directory: {directory}')
        for path in sorted(directory.glob('*.json')):
            if path.name == 'index.json':
                continue
            song = json.loads(path.read_text(encoding='utf-8'))
            errors = validate_song(song, path.name)
            if errors:
                parser.error(f'{path}: {errors}')
            enriched = harmonize_song(song)
            errors = validate_song(enriched, path.name)
            if errors:
                parser.error(f'{path}: {errors}')
            if song != enriched:
                changes.append((path, enriched))
            print(f'{path.name}: {len(enriched["chordSymbols"])} chord symbols'
                  f'{" (update)" if song != enriched else " (unchanged)"}')
    if not args.write:
        print(f'Dry run: {len(changes)} files would change. Use --write to save.')
        return
    if not changes:
        print('No changes needed.')
        return
    backup = ROOT / '.backups' / ('harmony-' + datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
    backup.mkdir(parents=True)
    manifest = []
    for i, (path, _) in enumerate(changes):
        target = backup / f'{i}-{path.name}'
        shutil.copy2(path, target)
        manifest.append({'original': str(path.resolve()), 'backup': target.name})
    (backup / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for path, enriched in changes:
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent,
                                             suffix='.tmp', delete=False) as stream:
                temporary = Path(stream.name)
                stream.write(json.dumps(enriched, ensure_ascii=False, indent=2) + '\n')
            os.replace(temporary, path)
        finally:
            if temporary and temporary.exists():
                temporary.unlink()
    print(f'Updated {len(changes)} files. Backup: {backup}')


if __name__ == '__main__':
    main()
