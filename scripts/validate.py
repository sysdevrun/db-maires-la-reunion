#!/usr/bin/env python3
"""Validate coherence of the La Réunion mayors database CSV files."""

import csv
import re
import sys
from datetime import date
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

from election_dates import ELECTIONS

CITY_ID_RE = re.compile(r"^974\d{2}$")


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


def validate_intercommunalites(rows, fieldnames):
    errors = []

    expected = {"siren", "nom", "nom_court"}
    missing = expected - set(fieldnames)
    if missing:
        errors.append(f"intercommunalites.csv: missing columns: {', '.join(sorted(missing))}")
        return errors

    seen_sirens = set()
    seen_short_names = set()
    for i, row in enumerate(rows, start=2):
        siren = row.get("siren", "").strip()
        nom = row.get("nom", "").strip()
        nom_court = row.get("nom_court", "").strip()

        if not siren:
            errors.append(f"  Row {i}: empty siren")
        elif siren in seen_sirens:
            errors.append(f"  Row {i}: duplicate siren '{siren}'")
        else:
            seen_sirens.add(siren)

        if not nom:
            errors.append(f"  Row {i}: empty nom")

        if not nom_court:
            errors.append(f"  Row {i}: empty nom_court")
        elif nom_court in seen_short_names:
            errors.append(f"  Row {i}: duplicate nom_court '{nom_court}'")
        else:
            seen_short_names.add(nom_court)

    if errors:
        errors.insert(0, "intercommunalites.csv:")
    return errors


def validate_cities(rows, fieldnames, interco_short_names):
    errors = []

    expected = {"code_insee", "nom", "interco"}
    missing = expected - set(fieldnames)
    if missing:
        errors.append(f"communes.csv: missing columns: {', '.join(sorted(missing))}")
        return errors

    seen_ids = set()
    seen_names = set()
    referenced_intercos = set()
    for i, row in enumerate(rows, start=2):
        city_id = row.get("code_insee", "").strip()
        name = row.get("nom", "").strip()
        interco = row.get("interco", "").strip()

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

        if not interco:
            errors.append(f"  Row {i}: empty interco")
        elif interco not in interco_short_names:
            errors.append(f"  Row {i}: interco '{interco}' not found in intercommunalites.csv")
        else:
            referenced_intercos.add(interco)

    # Check orphan intercommunalités
    orphan_intercos = interco_short_names - referenced_intercos
    if orphan_intercos:
        errors.append(f"  Orphan intercommunalités (in intercommunalites.csv but not in communes.csv): {', '.join(sorted(orphan_intercos))}")

    if errors:
        errors.insert(0, "communes.csv:")
    return errors


def validate_mayors(rows, fieldnames):
    errors = []

    expected = {"nom", "prenom", "date_naissance", "genre"}
    missing = expected - set(fieldnames)
    if missing:
        errors.append(f"maires.csv: missing columns: {', '.join(sorted(missing))}")
        return errors

    valid_genders = {"M", "F", "unknown"}
    seen_names = set()
    for i, row in enumerate(rows, start=2):
        last_name = row.get("nom", "").strip()
        first_name = row.get("prenom", "").strip()
        birth_date = row.get("date_naissance", "").strip()
        gender = row.get("genre", "").strip()

        if not last_name:
            errors.append(f"  Row {i}: empty last_name")
        if not first_name:
            errors.append(f"  Row {i}: empty first_name")

        if not gender:
            errors.append(f"  Row {i}: empty gender")
        elif gender not in valid_genders:
            errors.append(f"  Row {i}: gender '{gender}' is not one of {', '.join(sorted(valid_genders))}")

        if last_name and first_name:
            name_key = (last_name.lower(), first_name.lower())
            if name_key in seen_names:
                errors.append(f"  Row {i}: duplicate mayor name '{first_name} {last_name}'")
            else:
                seen_names.add(name_key)

        if birth_date:
            parse_date(birth_date, "date_naissance", i, errors)

    if errors:
        errors.insert(0, "maires.csv:")
    return errors


def validate_mayors_by_city(rows, fieldnames, city_ids, mayor_names, mayor_birth_dates):
    errors = []

    expected = {"code_insee", "nom_maire", "date_debut", "date_fin"}
    missing = expected - set(fieldnames)
    if missing:
        errors.append(f"mandats.csv: missing columns: {', '.join(sorted(missing))}")
        return errors

    referenced_city_ids = set()
    referenced_mayor_names = set()
    mandates_by_city = {}
    mandates_by_mayor = {}

    for i, row in enumerate(rows, start=2):
        city_id = row.get("code_insee", "").strip()
        mayor_name = row.get("nom_maire", "").strip()
        start_date_str = row.get("date_debut", "").strip()
        end_date_str = row.get("date_fin", "").strip()

        if not city_id:
            errors.append(f"  Row {i}: empty city_id")
        elif city_id not in city_ids:
            errors.append(f"  Row {i}: city_id '{city_id}' not found in communes.csv")
        else:
            referenced_city_ids.add(city_id)

        if not mayor_name:
            errors.append(f"  Row {i}: empty mayor_name")
        elif mayor_name not in mayor_names:
            errors.append(f"  Row {i}: mayor_name '{mayor_name}' not found in maires.csv")
        else:
            referenced_mayor_names.add(mayor_name)

        start_d = None
        end_d = None

        if not start_date_str:
            errors.append(f"  Row {i}: empty start_date")
        else:
            start_d = parse_date(start_date_str, "date_debut", i, errors)

        if end_date_str:
            end_d = parse_date(end_date_str, "date_fin", i, errors)
            if start_d and end_d and end_d < start_d:
                errors.append(f"  Row {i}: end_date ({end_date_str}) is before start_date ({start_date_str})")

        # Check birthdate is before mandate start
        if mayor_name and start_d and mayor_name in mayor_birth_dates:
            birth_d = mayor_birth_dates[mayor_name]
            if birth_d >= start_d:
                errors.append(f"  Row {i}: mayor '{mayor_name}' birth_date ({birth_d}) is not before start_date ({start_d})")

        if city_id and start_d is not None:
            mandates_by_city.setdefault(city_id, []).append((start_d, end_d, i))

        if mayor_name and start_d is not None:
            mandates_by_mayor.setdefault(mayor_name, []).append((start_d, end_d, i))

    # Check for overlapping mandates per city
    for city_id, mandates in mandates_by_city.items():
        mandates.sort(key=lambda m: m[0])
        for j in range(1, len(mandates)):
            prev_start, prev_end, prev_row = mandates[j - 1]
            curr_start, curr_end, curr_row = mandates[j]
            if prev_end is None or curr_start < prev_end:
                errors.append(
                    f"  Rows {prev_row} & {curr_row}: overlapping mandates for city '{city_id}' "
                    f"({prev_start} - {prev_end or 'ongoing'} vs {curr_start} - {curr_end or 'ongoing'})"
                )

    # Check that no mandate spans an entire election (both rounds inside it),
    # allowing a grace period for the outgoing mayor to stay until installation.
    install_grace_days = 10
    for city_id, mandates in mandates_by_city.items():
        for start_d, end_d, row_num in mandates:
            if end_d is None:
                continue
            for year, r1, r2 in ELECTIONS:
                if start_d < r1 and (end_d - r2).days > install_grace_days:
                    errors.append(
                        f"  Row {row_num}: mandate in city '{city_id}' ({start_d} - {end_d}) "
                        f"spans entire {year} election ({r1} - {r2})"
                    )

    # Check mayor age at first mandate start (>= 18) and last mandate end (<= 100)
    for mayor_name, mandates in mandates_by_mayor.items():
        if mayor_name not in mayor_birth_dates:
            continue
        birth_d = mayor_birth_dates[mayor_name]
        mandates.sort(key=lambda m: m[0])
        first_start = mandates[0][0]
        age_at_start = (first_start - birth_d).days / 365.25
        if age_at_start < 18:
            errors.append(
                f"  Mayor '{mayor_name}': age {age_at_start:.0f} at first mandate start ({first_start}), must be >= 18"
            )
        last_end = mandates[-1][1]
        if last_end is not None:
            age_at_end = (last_end - birth_d).days / 365.25
            if age_at_end > 100:
                errors.append(
                    f"  Mayor '{mayor_name}': age {age_at_end:.0f} at last mandate end ({last_end}), must be <= 100"
                )

    # Check orphan mayors (in maires.csv but never referenced)
    orphan_mayors = mayor_names - referenced_mayor_names
    if orphan_mayors:
        errors.append(f"  Orphan mayors (in maires.csv but not in mandats.csv): {', '.join(sorted(orphan_mayors))}")

    # Check orphan cities (in communes.csv but never referenced)
    orphan_cities = city_ids - referenced_city_ids
    if orphan_cities:
        errors.append(f"  Orphan cities (in communes.csv but not in mandats.csv): {', '.join(sorted(orphan_cities))}")

    if errors:
        errors.insert(0, "mandats.csv:")
    return errors


def main():
    all_errors = []

    try:
        intercos, intercos_fields = load_csv(DATA_DIR / "intercommunalites.csv")
    except FileNotFoundError:
        print("ERROR: data/intercommunalites.csv not found")
        sys.exit(1)

    try:
        cities, cities_fields = load_csv(DATA_DIR / "communes.csv")
    except FileNotFoundError:
        print("ERROR: data/communes.csv not found")
        sys.exit(1)

    try:
        mayors, mayors_fields = load_csv(DATA_DIR / "maires.csv")
    except FileNotFoundError:
        print("ERROR: data/maires.csv not found")
        sys.exit(1)

    try:
        mandates, mandates_fields = load_csv(DATA_DIR / "mandats.csv")
    except FileNotFoundError:
        print("ERROR: data/mandats.csv not found")
        sys.exit(1)

    all_errors.extend(validate_intercommunalites(intercos, intercos_fields))

    # Build interco short names set for cross-reference
    interco_short_names = {row["nom_court"].strip() for row in intercos if row.get("nom_court", "").strip()}

    all_errors.extend(validate_cities(cities, cities_fields, interco_short_names))
    all_errors.extend(validate_mayors(mayors, mayors_fields))

    # Build sets for referential integrity
    city_ids = {row["code_insee"].strip() for row in cities if row.get("code_insee", "").strip()}
    mayor_names = set()
    mayor_birth_dates = {}
    for row in mayors:
        first = row.get("prenom", "").strip()
        last = row.get("nom", "").strip()
        if first and last:
            name = f"{first} {last}"
            mayor_names.add(name)
            bd = row.get("date_naissance", "").strip()
            if bd:
                try:
                    mayor_birth_dates[name] = date.fromisoformat(bd)
                except ValueError:
                    pass  # Already caught by validate_mayors

    all_errors.extend(validate_mayors_by_city(mandates, mandates_fields, city_ids, mayor_names, mayor_birth_dates))

    if all_errors:
        print("Validation FAILED:\n")
        for err in all_errors:
            print(err)
        print(f"\n{sum(1 for e in all_errors if not e.endswith(':'))} error(s) found.")
        sys.exit(1)
    else:
        print(f"All checks passed. ({len(intercos)} intercommunalités, {len(cities)} cities, {len(mayors)} mayors, {len(mandates)} mandates)")
        sys.exit(0)


if __name__ == "__main__":
    main()
