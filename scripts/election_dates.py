"""French municipal election dates (La Réunion)."""

from datetime import date

# Each entry: (year, first_round_date, second_round_date)
ELECTIONS = [
    (1900, date(1900, 5, 6), date(1900, 5, 13)),
    (1904, date(1904, 5, 1), date(1904, 5, 8)),
    (1908, date(1908, 5, 3), date(1908, 5, 10)),
    (1912, date(1912, 5, 5), date(1912, 5, 12)),
    (1919, date(1919, 11, 30), date(1919, 12, 7)),
    (1925, date(1925, 5, 3), date(1925, 5, 10)),
    (1929, date(1929, 5, 5), date(1929, 5, 12)),
    (1935, date(1935, 5, 5), date(1935, 5, 12)),
    (1945, date(1945, 4, 29), date(1945, 5, 13)),
    (1947, date(1947, 10, 19), date(1947, 10, 26)),
    (1953, date(1953, 4, 26), date(1953, 5, 3)),
    (1959, date(1959, 3, 8), date(1959, 3, 15)),
    (1965, date(1965, 3, 14), date(1965, 3, 21)),
    (1971, date(1971, 3, 14), date(1971, 3, 21)),
    (1977, date(1977, 3, 13), date(1977, 3, 20)),
    (1983, date(1983, 3, 6), date(1983, 3, 13)),
    (1989, date(1989, 3, 12), date(1989, 3, 19)),
    (1995, date(1995, 6, 11), date(1995, 6, 18)),
    (2001, date(2001, 3, 11), date(2001, 3, 18)),
    (2008, date(2008, 3, 9), date(2008, 3, 16)),
    (2014, date(2014, 3, 23), date(2014, 3, 30)),
    (2020, date(2020, 3, 15), date(2020, 6, 28)),
    (2026, date(2026, 3, 15), date(2026, 3, 22)),
]

# First-round dates only — used as default split points
ELECTION_FIRST_ROUND_DATES = sorted(r1 for _, r1, _ in ELECTIONS)

# All election dates (both rounds) — used by validation
ALL_ELECTION_DATES = sorted({d for _, r1, r2 in ELECTIONS for d in (r1, r2)})
