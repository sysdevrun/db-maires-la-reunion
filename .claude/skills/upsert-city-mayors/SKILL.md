---
name: upsert-city-mayors
description: Accept text describing mayors of a La Réunion commune (e.g. from Wikipedia) and upsert the data into the three CSV files (communes.csv, maires.csv, mandats.csv). Use when the user pastes or provides text about mayors of a commune.
argument-hint: [text describing mayors for a city]
allowed-tools: Read, Edit, Write, Bash, Grep
---

# Upsert City Mayors Data

You are given text (typically from Wikipedia or a similar source) describing the mayors of a commune in La Réunion. Parse it and update the three CSV data files.

## Input

`$ARGUMENTS` contains the raw text. It should mention:
- The commune name
- A list of mayors with their mandate periods (start/end dates)
- Optionally: mayor first names, last names, birth dates

## CSV file locations (relative to repo root)

- `data/communes.csv` — columns: `code_insee,nom`
- `data/maires.csv` — columns: `nom,prenom,date_naissance,genre`
- `data/mandats.csv` — columns: `code_insee,nom_commune,nom_maire,date_debut,date_fin`

Mayors are identified by their full name (`prenom` + space + `nom`). The `nom_maire` column in `mandats.csv` must match exactly `prenom + " " + nom` from `maires.csv`.

## Step-by-step process

### 1. Identify the commune

- Extract the commune name from the text.
- Look up its INSEE code (974XX). The 24 communes of La Réunion are:
  - 97401: Les Avirons
  - 97402: Bras-Panon
  - 97403: Entre-Deux
  - 97404: L'Étang-Salé
  - 97405: Petite-Île
  - 97406: La Plaine-des-Palmistes
  - 97407: Le Port
  - 97408: La Possession
  - 97409: Saint-André
  - 97410: Saint-Benoît
  - 97411: Saint-Denis
  - 97412: Saint-Joseph
  - 97413: Saint-Leu
  - 97414: Saint-Louis
  - 97415: Saint-Paul
  - 97416: Saint-Philippe
  - 97417: Saint-Pierre
  - 97418: Sainte-Marie
  - 97419: Sainte-Rose
  - 97420: Sainte-Suzanne
  - 97421: Salazie
  - 97422: Le Tampon
  - 97423: Les Trois-Bassins
  - 97424: Cilaos
- If the commune is not already in `data/communes.csv`, add it.

### 2. Parse mayors from the text

Extract for each mayor:
- `nom` and `prenom`
- `date_naissance` (YYYY-MM-DD format, leave empty if unknown)
- `date_debut` and `date_fin` of mandate (YYYY-MM-DD format, empty date_fin = ongoing)

Date handling:
- If only a year is given (e.g. "1965"), use `YYYY-01-01` as approximation.
- If month and year (e.g. "mars 1965"), use `YYYY-MM-01`.
- If exact date is given, use it directly.
- The text may be in French — parse French month names (janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre).

### 3. Read existing files

Read all three CSV files to understand current state.

### 4. Upsert mayors into `data/maires.csv`

For each mayor extracted:
- Search by `nom` AND `prenom` (case-insensitive match).
- If found: update `date_naissance` if we now have one and the existing value is empty. Do NOT overwrite an existing date_naissance.
- If not found: add a new row.
- Sort `maires.csv` alphabetically by `nom`, then `prenom`.

### 5. Upsert mandates into `data/mandats.csv`

For each mandate extracted:
- Build `nom_maire` as `prenom + " " + nom` (matching exactly what's in maires.csv).
- Search for an existing row matching `code_insee` + `nom_maire` + `date_debut`.
- If found: update `date_fin` if we have new information.
- If not found: add a new row.

### 6. Write updated files

Write the updated CSV files. Preserve:
- UTF-8 encoding
- No trailing whitespace
- A final newline after the last row
- Sort `communes.csv` by `code_insee`
- Sort `maires.csv` by `nom`, then `prenom`
- Sort `mandats.csv` by `code_insee`, then `date_debut`

### 7. Validate

Run `python3 scripts/validate.py` and report the result. If validation fails, fix the errors.

## Important rules

- NEVER delete existing data. Only add or update.
- If the text is ambiguous about a person's identity (same last name, different first name), treat them as different people.
- If a same-name father/son situation arises, disambiguate by adding "(fils)" to the first name of the younger one.
- If a mayor served multiple non-consecutive terms, create separate mandate rows.
- Always double-check that `nom_maire` in mandats.csv matches exactly `prenom + " " + nom` from maires.csv.
- Each mandate row should represent a single election cycle. If a mayor served continuously across multiple election cycles, create separate rows split at election first-round dates. Run `python3 scripts/split_mandates.py` after upserting to ensure proper splitting.
- Show the user a summary of changes made (new cities, new mayors, new/updated mandates).
