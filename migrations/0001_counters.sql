CREATE TABLE counters (
  id TEXT PRIMARY KEY NOT NULL,
  namespace TEXT NOT NULL,
  name TEXT NOT NULL,
  visit INTEGER NOT NULL CHECK (visit BETWEEN 1 AND 9007199254740991),
  visitor INTEGER NOT NULL CHECK (visitor BETWEEN 0 AND visit),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (namespace, name)
) STRICT, WITHOUT ROWID;

CREATE TABLE visitors (
  counter_id TEXT NOT NULL REFERENCES counters (id),
  fingerprint BLOB NOT NULL CHECK (length(fingerprint) = 32),
  PRIMARY KEY (counter_id, fingerprint)
) STRICT, WITHOUT ROWID;
