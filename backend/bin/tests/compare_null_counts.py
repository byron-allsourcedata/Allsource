import json
import argparse
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)


def load_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def compare_dicts(was_data, now_data):
    comparison = {}

    all_keys = set(was_data.keys()) | set(now_data.keys())
    for key in all_keys:
        was_vals = was_data.get(key, {})
        now_vals = now_data.get(key, {})

        all_subkeys = set(was_vals.keys()) | set(now_vals.keys())
        comparison[key] = {}

        for subkey in all_subkeys:
            was = was_vals.get(subkey)
            now = now_vals.get(subkey)

            entry = {}
            entry["was"] = was if was is not None else "undefined"
            entry["now"] = now if now is not None else "undefined"

            comparison[key][subkey] = entry

    return comparison


def main():
    parser = argparse.ArgumentParser(
        description="Compare two JSON files of null stats."
    )
    parser.add_argument(
        "was_file", help="Path to JSON file with previous stats"
    )
    parser.add_argument("now_file", help="Path to JSON file with current stats")
    parser.add_argument("--output", help="Optional output file name")
    args = parser.parse_args()

    was_data = load_json(args.was_file)
    now_data = load_json(args.now_file)

    comparison = compare_dicts(was_data, now_data)

    output_filename = (
        args.output
        or f"comparison_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    save_json(comparison, output_filename)
    logging.info(f"Comparison saved to {output_filename}")


if __name__ == "__main__":
    main()
