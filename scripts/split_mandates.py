#!/usr/bin/env python3
"""Split mayor periods into actual mandates based on French municipal election dates."""

import csv
import sys
from datetime import date
from pathlib import Path

from election_dates import ELECTION_FIRST_ROUND_DATES

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MAYORS_BY_CITY = DATA_DIR / "mayors_by_city.csv"


def split_mandate(start_date, end_date, election_dates):
    """Split a mandate at election dates that fall strictly between start and end.

    Returns a list of (start, end) tuples. end can be None for the final segment
    of an ongoing mandate.
    """
    # For ongoing mandates, find elections after start that have already occurred
    if end_date is None:
        today = date.today()
        split_points = [e for e in election_dates if start_date < e <= today]
    else:
        split_points = [e for e in election_dates if start_date < e < end_date]

    if not split_points:
        return [(start_date, end_date)]

    boundaries = [start_date] + split_points + [end_date]
    segments = []
    for i in range(len(boundaries) - 1):
        seg_start = boundaries[i]
        seg_end = boundaries[i + 1]
        segments.append((seg_start, seg_end))
    return segments


def main():
    with open(MAYORS_BY_CITY, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    original_count = len(rows)
    new_rows = []
    split_count = 0

    for row in rows:
        city_id = row["city_id"]
        mayor_name = row["mayor_name"]
        start_d = date.fromisoformat(row["start_date"])
        end_d = date.fromisoformat(row["end_date"]) if row["end_date"] else None

        segments = split_mandate(start_d, end_d, ELECTION_FIRST_ROUND_DATES)

        if len(segments) > 1:
            split_count += 1
            end_str = row["end_date"] or "ongoing"
            print(f"  {city_id} {mayor_name}: {row['start_date']} -> {end_str} => {len(segments)} mandates")

        for seg_start, seg_end in segments:
            new_rows.append({
                "city_id": city_id,
                "mayor_name": mayor_name,
                "start_date": seg_start.isoformat(),
                "end_date": seg_end.isoformat() if seg_end else "",
            })

    # Sort by city_id, then start_date
    new_rows.sort(key=lambda r: (r["city_id"], r["start_date"]))

    with open(MAYORS_BY_CITY, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["city_id", "mayor_name", "start_date", "end_date"])
        writer.writeheader()
        writer.writerows(new_rows)

    new_count = len(new_rows)
    print(f"\nOriginal rows: {original_count}")
    print(f"Rows split: {split_count}")
    print(f"New total rows: {new_count}")

    if split_count == 0:
        print("No mandates needed splitting (already idempotent).")
    else:
        print(f"Added {new_count - original_count} new mandate rows.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
