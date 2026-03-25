#!/usr/bin/env python3
"""List mayors with no birthdate, their city, and earliest mandate date."""

import csv
from datetime import date
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_csv(filepath):
    with open(filepath, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def main():
    cities_rows = load_csv(DATA_DIR / "cities.csv")
    mayors_rows = load_csv(DATA_DIR / "mayors.csv")
    mandates_rows = load_csv(DATA_DIR / "mayors_by_city.csv")

    cities = {row["city_id"]: row["name"] for row in cities_rows}

    # Mayors with no birthdate
    no_birthdate = set()
    for row in mayors_rows:
        if not row.get("birth_date", "").strip():
            name = f"{row['first_name']} {row['last_name']}"
            no_birthdate.add(name)

    # Find earliest mandate per mayor
    earliest = {}
    for row in mandates_rows:
        mayor = row["mayor_name"]
        if mayor not in no_birthdate:
            continue
        start = date.fromisoformat(row["start_date"])
        city = cities.get(row["city_id"], row["city_id"])
        if mayor not in earliest or start < earliest[mayor][1]:
            earliest[mayor] = (city, start)

    results = sorted(earliest.items(), key=lambda x: x[1][1])

    print(f"{'Maire':<45} {'Commune':<25} {'Premier mandat'}")
    print(f"{'-'*45} {'-'*25} {'-'*14}")
    for mayor, (city, start) in results:
        print(f"{mayor:<45} {city:<25} {start}")
    print(f"\n{len(results)} maire(s) sans date de naissance.")


if __name__ == "__main__":
    main()
