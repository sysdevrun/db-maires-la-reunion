# Base de données des maires de La Réunion

**[Consulter le site web](https://sysdevrun.github.io/db-maires-la-reunion/)**

Données publiques sur les communes et maires de La Réunion (département 974).

## Fichiers

### `data/cities.csv`

Liste des 24 communes de La Réunion.

| Colonne | Obligatoire | Description |
|---------|-------------|-------------|
| `city_id` | oui | Code INSEE de la commune (ex: `97401`) |
| `name` | oui | Nom officiel de la commune |

### `data/mayors.csv`

Informations biographiques des maires.

| Colonne | Obligatoire | Description |
|---------|-------------|-------------|
| `last_name` | oui | Nom de famille |
| `first_name` | oui | Prénom(s) |
| `birth_date` | non | Date de naissance (`AAAA-MM-JJ`, vide si inconnue) |
| `gender` | oui | Genre : `M` (homme), `F` (femme) |

### `data/mayors_by_city.csv`

Mandats de maires par commune.

| Colonne | Obligatoire | Description |
|---------|-------------|-------------|
| `city_id` | oui | Code INSEE → `cities.csv` |
| `city_name` | oui | Nom de la commune (dénormalisé depuis `cities.csv`) |
| `mayor_name` | oui | Prénom + Nom → `mayors.csv` |
| `start_date` | oui | Début du mandat (`AAAA-MM-JJ`) |
| `end_date` | non | Fin du mandat (`AAAA-MM-JJ`, vide = en cours) |

## Validation

```bash
python3 scripts/validate.py
```

Vérifie la cohérence des données : intégrité référentielle, formats, doublons, chevauchements de mandats.

## Licence

[CC0 1.0 Universal](LICENSE) — Domaine public.
