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
    cities_rows = load_csv(DATA_DIR / "communes.csv")
    mayors_rows = load_csv(DATA_DIR / "maires.csv")
    mandates_rows = load_csv(DATA_DIR / "mandats.csv")

    cities = {row["code_insee"]: row["nom"] for row in cities_rows}

    # Mayors with no birthdate
    no_birthdate = set()
    for row in mayors_rows:
        if not row.get("date_naissance", "").strip():
            name = f"{row['prenom']} {row['nom']}"
            no_birthdate.add(name)

    # Find earliest mandate per mayor
    earliest = {}
    for row in mandates_rows:
        mayor = row["nom_maire"]
        if mayor not in no_birthdate:
            continue
        start = date.fromisoformat(row["date_debut"])
        city = cities.get(row["code_insee"], row["code_insee"])
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
