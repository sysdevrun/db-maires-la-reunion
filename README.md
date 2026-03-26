# Base de données des maires de La Réunion

**[Consulter le site web](https://sysdevrun.github.io/db-maires-la-reunion/)**

Données publiques sur les communes et maires de La Réunion (département 974).

## Fichiers

### `data/communes.csv`

Liste des 24 communes de La Réunion.

| Colonne | Obligatoire | Description |
|---------|-------------|-------------|
| `code_insee` | oui | Code INSEE de la commune (ex: `97401`) |
| `nom` | oui | Nom officiel de la commune |

### `data/maires.csv`

Informations biographiques des maires.

| Colonne | Obligatoire | Description |
|---------|-------------|-------------|
| `nom` | oui | Nom de famille |
| `prenom` | oui | Prénom(s) |
| `date_naissance` | non | Date de naissance (`AAAA-MM-JJ`, vide si inconnue) |
| `genre` | oui | Genre : `M` (homme), `F` (femme) |

### `data/mandats.csv`

Mandats de maires par commune.

| Colonne | Obligatoire | Description |
|---------|-------------|-------------|
| `code_insee` | oui | Code INSEE → `communes.csv` |
| `nom_commune` | oui | Nom de la commune (dénormalisé depuis `communes.csv`) |
| `nom_maire` | oui | Prénom + Nom → `maires.csv` |
| `date_debut` | oui | Début du mandat (`AAAA-MM-JJ`) |
| `date_fin` | non | Fin du mandat (`AAAA-MM-JJ`, vide = en cours) |

## Validation

```bash
python3 scripts/validate.py
```

Vérifie la cohérence des données : intégrité référentielle, formats, doublons, chevauchements de mandats.

## Licence

[CC0 1.0 Universal](LICENSE) — Domaine public.
