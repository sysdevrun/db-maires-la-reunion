#!/usr/bin/env python3
"""Validate coherence of the La Réunion mayors database CSV files."""

import csv
import re
import sys
from datetime import date
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

CITY_ID_RE = re.compile(r"^974\d{2}$")
MAYOR_ID_RE = re.compile(r"^M\d{4}$")


def load_csv(filepath):
    """Load a CSV file and return (rows, fieldnames)."""
    with open(filepath, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        return rows, reader.fieldnames or []


def parse_date(value, label, row_num, errors):
    """Parse an ISO date string, appending to errors on failure. Returns date or None."""
    try:
        return date.fromisoformat(value)
    except ValueError:
        errors.append(f"  Row {row_num}: {label} '{value}' is not a valid YYYY-MM-DD date")
        return None


def validate_cities(rows, fieldnames):
    errors = []

    # Check columns
    expected = {"city_id", "name"}
    missing = expected - set(fieldnames)
    if missing:
        errors.append(f"cities.csv: missing columns: {', '.join(sorted(missing))}")
        return errors  # Can't validate rows without correct columns

    seen_ids = set()
    seen_names = set()
    for i, row in enumerate(rows, start=2):  # Row 2 = first data row (header is row 1)
        city_id = row.get("city_id", "").strip()
        name = row.get("name", "").strip()

        if not city_id:
            errors.append(f"  Row {i}: empty city_id")
        elif not CITY_ID_RE.match(city_id):
            errors.append(f"  Row {i}: city_id '{city_id}' does not match 974XX pattern")
        elif city_id in seen_ids:
            errors.append(f"  Row {i}: duplicate city_id '{city_id}'")
        else:
            seen_ids.add(city_id)

        if not name:
            errors.append(f"  Row {i}: empty name")
        else:
            name_key = name.lower()
            if name_key in seen_names:
                errors.append(f"  Row {i}: duplicate city name '{name}'")
            else:
                seen_names.add(name_key)

    if errors:
        errors.insert(0, "cities.csv:")
    return errors


def validate_mayors(rows, fieldnames):
    errors = []

    expected = {"mayor_id", "last_name", "first_name", "birth_date"}
    missing = expected - set(fieldnames)
    if missing:
        errors.append(f"mayors.csv: missing columns: {', '.join(sorted(missing))}")
        return errors

    seen_ids = set()
    seen_names = set()
    for i, row in enumerate(rows, start=2):
        mayor_id = row.get("mayor_id", "").strip()
        last_name = row.get("last_name", "").strip()
        first_name = row.get("first_name", "").strip()
        birth_date = row.get("birth_date", "").strip()

        if not mayor_id:
            errors.append(f"  Row {i}: empty mayor_id")
        elif not MAYOR_ID_RE.match(mayor_id):
            errors.append(f"  Row {i}: mayor_id '{mayor_id}' does not match M0000 pattern")
        elif mayor_id in seen_ids:
            errors.append(f"  Row {i}: duplicate mayor_id '{mayor_id}'")
        else:
            seen_ids.add(mayor_id)

        if not last_name:
            errors.append(f"  Row {i}: empty last_name")
        if not first_name:
            errors.append(f"  Row {i}: empty first_name")

        if last_name and first_name:
            name_key = (last_name.lower(), first_name.lower())
            if name_key in seen_names:
                errors.append(f"  Row {i}: duplicate mayor name '{first_name} {last_name}'")
            else:
                seen_names.add(name_key)

        if birth_date:
            parse_date(birth_date, "birth_date", i, errors)

    if errors:
        errors.insert(0, "mayors.csv:")
    return errors


def validate_mayors_by_city(rows, fieldnames, city_ids, mayor_ids):
    errors = []

    expected = {"city_id", "mayor_id", "start_date", "end_date"}
    missing = expected - set(fieldnames)
    if missing:
        errors.append(f"mayors_by_city.csv: missing columns: {', '.join(sorted(missing))}")
        return errors

    referenced_city_ids = set()
    referenced_mayor_ids = set()
    # For overlap checking: city_id -> list of (start, end, row_num)
    mandates_by_city = {}

    for i, row in enumerate(rows, start=2):
        city_id = row.get("city_id", "").strip()
        mayor_id = row.get("mayor_id", "").strip()
        start_date_str = row.get("start_date", "").strip()
        end_date_str = row.get("end_date", "").strip()

        if not city_id:
            errors.append(f"  Row {i}: empty city_id")
        elif city_id not in city_ids:
            errors.append(f"  Row {i}: city_id '{city_id}' not found in cities.csv")
        else:
            referenced_city_ids.add(city_id)

        if not mayor_id:
            errors.append(f"  Row {i}: empty mayor_id")
        elif mayor_id not in mayor_ids:
            errors.append(f"  Row {i}: mayor_id '{mayor_id}' not found in mayors.csv")
        else:
            referenced_mayor_ids.add(mayor_id)

        start_d = None
        end_d = None

        if not start_date_str:
            errors.append(f"  Row {i}: empty start_date")
        else:
            start_d = parse_date(start_date_str, "start_date", i, errors)

        if end_date_str:
            end_d = parse_date(end_date_str, "end_date", i, errors)
            if start_d and end_d and end_d < start_d:
                errors.append(f"  Row {i}: end_date ({end_date_str}) is before start_date ({start_date_str})")

        if city_id and start_d is not None:
            mandates_by_city.setdefault(city_id, []).append((start_d, end_d, i))

    # Check for overlapping mandates per city
    for city_id, mandates in mandates_by_city.items():
        mandates.sort(key=lambda m: m[0])
        for j in range(1, len(mandates)):
            prev_start, prev_end, prev_row = mandates[j - 1]
            curr_start, curr_end, curr_row = mandates[j]
            if prev_end is None or curr_start <= prev_end:
                # Overlap: previous mandate has no end, or current starts before previous ends
                # Allow same-day transition (prev_end == curr_start is not an overlap)
                if prev_end is None or curr_start < prev_end:
                    errors.append(
                        f"  Rows {prev_row} & {curr_row}: overlapping mandates for city '{city_id}' "
                        f"({prev_start} - {prev_end or 'ongoing'} vs {curr_start} - {curr_end or 'ongoing'})"
                    )

    # Check orphan mayors (in mayors.csv but never referenced)
    orphan_mayors = mayor_ids - referenced_mayor_ids
    if orphan_mayors:
        errors.append(f"  Orphan mayors (in mayors.csv but not in mayors_by_city.csv): {', '.join(sorted(orphan_mayors))}")

    # Check orphan cities (in cities.csv but never referenced)
    orphan_cities = city_ids - referenced_city_ids
    if orphan_cities:
        errors.append(f"  Orphan cities (in cities.csv but not in mayors_by_city.csv): {', '.join(sorted(orphan_cities))}")

    if errors:
        errors.insert(0, "mayors_by_city.csv:")
    return errors


def main():
    all_errors = []

    # Load files
    try:
        cities, cities_fields = load_csv(DATA_DIR / "cities.csv")
    except FileNotFoundError:
        print("ERROR: data/cities.csv not found")
        sys.exit(1)

    try:
        mayors, mayors_fields = load_csv(DATA_DIR / "mayors.csv")
    except FileNotFoundError:
        print("ERROR: data/mayors.csv not found")
        sys.exit(1)

    try:
        mandates, mandates_fields = load_csv(DATA_DIR / "mayors_by_city.csv")
    except FileNotFoundError:
        print("ERROR: data/mayors_by_city.csv not found")
        sys.exit(1)

    # Validate each file
    all_errors.extend(validate_cities(cities, cities_fields))
    all_errors.extend(validate_mayors(mayors, mayors_fields))

    # Build ID sets for referential integrity checks
    city_ids = {row["city_id"].strip() for row in cities if row.get("city_id", "").strip()}
    mayor_ids = {row["mayor_id"].strip() for row in mayors if row.get("mayor_id", "").strip()}

    all_errors.extend(validate_mayors_by_city(mandates, mandates_fields, city_ids, mayor_ids))

    # Report
    if all_errors:
        print("Validation FAILED:\n")
        for err in all_errors:
            print(err)
        print(f"\n{sum(1 for e in all_errors if not e.endswith(':'))} error(s) found.")
        sys.exit(1)
    else:
        print(f"All checks passed. ({len(cities)} cities, {len(mayors)} mayors, {len(mandates)} mandates)")
        sys.exit(0)


if __name__ == "__main__":
    main()
