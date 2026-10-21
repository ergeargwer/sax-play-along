"""Read-only MusicXML inventory; does not infer pitch conventions or repair OMR."""
import argparse
import json
from fractions import Fraction
from pathlib import Path
import xml.etree.ElementTree as ET


def audit(path):
    root = ET.parse(path).getroot()
    for node in root.iter():
        node.tag = node.tag.rsplit('}', 1)[-1]
    result = {'file': path.name, 'software': sorted({x.text for x in root.findall('.//software') if x.text}), 'parts': []}
    for part in root.findall('part'):
        divisions, meter = 1, None
        mismatches = []
        for measure in part.findall('measure'):
            divisions = int(measure.findtext('attributes/divisions', str(divisions)))
            time = measure.find('attributes/time')
            if time is not None:
                meter = Fraction(time.findtext('beats')) * 4 / int(time.findtext('beat-type'))
            cursor = end = Fraction(0)
            for node in measure:
                duration = Fraction(node.findtext('duration', '0')) / divisions
                if node.tag == 'backup':
                    cursor -= duration
                elif node.tag == 'forward':
                    cursor += duration
                elif node.tag == 'note' and node.find('chord') is None and node.find('grace') is None:
                    cursor += duration
                end = max(end, cursor)
            if meter is not None and end != meter:
                mismatches.append({'measure': measure.get('number'), 'actual': str(end), 'expected': str(meter), 'implicit': measure.get('implicit')})
        result['parts'].append({
            'id': part.get('id'), 'measures': len(part.findall('measure')),
            'meters': sorted({f"{t.findtext('beats')}/{t.findtext('beat-type')}" for t in part.findall('.//time')}),
            'keys': sorted({x.text for x in part.findall('.//key/fifths')}),
            'transpose': [ET.tostring(x, encoding='unicode').strip() for x in part.findall('.//transpose')],
            'tempos': sorted({x.get('tempo') for x in part.findall('.//sound') if x.get('tempo')}),
            'metronomes': len(part.findall('.//metronome')),
            'voices': sorted({x.text for x in part.findall('.//voice')}),
            'tuplets': len(part.findall('.//time-modification')),
            'ties': len(part.findall('.//tie')),
            'harmonies': len(part.findall('.//harmony')),
            'repeat_markers': len(part.findall('.//repeat')) + len(part.findall('.//ending')),
            'duration_mismatches': mismatches,
        })
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    args = parser.parse_args()
    results = []
    for path in sorted(args.directory.glob('*.musicxml')):
        try:
            results.append(audit(path))
        except (ET.ParseError, ValueError, ZeroDivisionError) as exc:
            results.append({'file': path.name, 'error': str(exc)})
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
