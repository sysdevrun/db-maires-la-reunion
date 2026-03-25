#!/usr/bin/env python3
"""Migrate mayors_by_city.csv from mayor_id to mayor_name, and remove mayor_id from mayors.csv."""

import csv
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def main():
    # Load mayors to build id -> name mapping
    with open(DATA_DIR / "mayors.csv", encoding="utf-8", newline="") as f:
        mayors = list(csv.DictReader(f))

    id_to_name = {}
    for row in mayors:
        mayor_id = row["mayor_id"].strip()
        first_name = row["first_name"].strip()
        last_name = row["last_name"].strip()
        id_to_name[mayor_id] = f"{first_name} {last_name}"

    # Rewrite mayors_by_city.csv: replace mayor_id with mayor_name
    with open(DATA_DIR / "mayors_by_city.csv", encoding="utf-8", newline="") as f:
        mandates = list(csv.DictReader(f))

    with open(DATA_DIR / "mayors_by_city.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["city_id", "mayor_name", "start_date", "end_date"])
        for row in mandates:
            mayor_id = row["mayor_id"].strip()
            name = id_to_name.get(mayor_id)
            if name is None:
                print(f"WARNING: unknown mayor_id '{mayor_id}', skipping")
                continue
            writer.writerow([
                row["city_id"].strip(),
                name,
                row["start_date"].strip(),
                row["end_date"].strip(),
            ])

    # Rewrite mayors.csv without mayor_id
    with open(DATA_DIR / "mayors.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["last_name", "first_name", "birth_date"])
        for row in sorted(mayors, key=lambda r: (r["last_name"].strip().lower(), r["first_name"].strip().lower())):
            writer.writerow([
                row["last_name"].strip(),
                row["first_name"].strip(),
                row["birth_date"].strip(),
            ])

    print(f"Migrated {len(mandates)} mandates and {len(mayors)} mayors.")


if __name__ == "__main__":
    main()
