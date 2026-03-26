#!/usr/bin/env python3
"""Split mayor periods into actual mandates based on French municipal election dates."""

import csv
import sys
from datetime import date
from pathlib import Path

from election_dates import ELECTIONS

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MAYORS_BY_CITY = DATA_DIR / "mayors_by_city.csv"

# Index elections by year for fast lookup
_ELECTIONS_BY_YEAR = {year: (r1, r2) for year, r1, r2 in ELECTIONS}
_ALL_ROUND_DATES = {d for _, r1, r2 in ELECTIONS for d in (r1, r2)}


def snap_to_election(d):
    """Snap approximate dates to the nearest election round when appropriate.

    Precision rules:
    - YYYY-01-01 (Jan 1st): year-only approximation. Day and month unknown.
      If it's an election year, snap to the nearest round.
    - YYYY-MM-01 (1st of any other month): month-only approximation. Day unknown.
      Snap if within 30 days of an election round.
    - Other dates: considered exact, never snapped.

    Returns the (possibly snapped) date.
    """
    if d is None:
        return None
    if d in _ALL_ROUND_DATES:
        return d  # already exact

    year = d.year
    if year not in _ELECTIONS_BY_YEAR:
        return d  # not an election year, nothing to snap to

    is_jan1 = d.month == 1 and d.day == 1
    is_first_of_month = d.day == 1 and not is_jan1

    if not is_jan1 and not is_first_of_month:
        return d  # exact date, don't snap

    r1, r2 = _ELECTIONS_BY_YEAR[year]
    d1 = abs((d - r1).days)
    d2 = abs((d - r2).days)
    closest = r1 if d1 <= d2 else r2

    if is_jan1:
        # Year-only precision: always snap in election years
        return closest

    # Month-only precision: snap if within 30 days
    if min(d1, d2) <= 30:
        return closest

    return d


def _detect_boundary_rounds(start_date, end_date):
    """Detect which round the start and end boundaries align with.

    Returns (start_round, end_round) where each is 'r1', 'r2', or None.
    """
    start_round = None
    end_round = None
    for _, r1, r2 in ELECTIONS:
        if start_date == r1:
            start_round = 'r1'
        elif start_date == r2:
            start_round = 'r2'
        if end_date is not None:
            if end_date == r1:
                end_round = 'r1'
            elif end_date == r2:
                end_round = 'r2'
    return start_round, end_round


def split_mandate(start_date, end_date):
    """Split a mandate at election dates that fall strictly between start and end.

    For each election whose rounds fall inside the mandate, picks the round
    closest in pattern to the nearer boundary. E.g., if start is on r1 and
    end is on r2, elections closer to start split on r1, elections closer to
    end split on r2.

    Returns a list of (start, end) tuples. end can be None for ongoing mandates.
    """
    effective_end = end_date if end_date else date.today()
    start_round, end_round = _detect_boundary_rounds(start_date, end_date)

    split_points = []
    for _, r1, r2 in ELECTIONS:
        r1_inside = start_date < r1 < effective_end
        r2_inside = start_date < r2 < effective_end

        if not r1_inside and not r2_inside:
            continue

        # Don't split within the same election the mandate started or ended on.
        # If start == r1 or r2 of this election, the mandate began at this
        # election — don't split at the other round of the same election.
        if start_date == r1 or start_date == r2:
            continue
        if end_date == r1 or end_date == r2:
            continue

        if r1_inside and not r2_inside:
            split_points.append(r1)
        elif r2_inside and not r1_inside:
            split_points.append(r2)
        else:
            # Both rounds inside the mandate. Pick based on which boundary
            # is closer, and follow that boundary's round pattern.
            midpoint = start_date.toordinal() + (effective_end.toordinal() - start_date.toordinal()) / 2
            election_mid = (r1.toordinal() + r2.toordinal()) / 2

            if election_mid <= midpoint:
                # Election is closer to start — follow start boundary's pattern
                pref = start_round
            else:
                # Election is closer to end — follow end boundary's pattern
                pref = end_round

            if pref == 'r1':
                split_points.append(r1)
            elif pref == 'r2':
                split_points.append(r2)
            else:
                # No boundary alignment — pick round with largest min gap
                gap1 = min((r1 - start_date).days, (effective_end - r1).days)
                gap2 = min((r2 - start_date).days, (effective_end - r2).days)
                split_points.append(r1 if gap1 >= gap2 else r2)

    split_points.sort()

    if not split_points:
        return [(start_date, end_date)]

    boundaries = [start_date] + split_points + [end_date]
    segments = []
    for i in range(len(boundaries) - 1):
        segments.append((boundaries[i], boundaries[i + 1]))
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
        start_d = snap_to_election(date.fromisoformat(row["start_date"]))
        end_d = snap_to_election(date.fromisoformat(row["end_date"])) if row["end_date"] else None

        segments = split_mandate(start_d, end_d)

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
