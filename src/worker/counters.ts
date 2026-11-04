export interface Counter {
  visit: number;
  visitor: number;
}

export function readCounter(
  db: D1Database,
  namespace: string,
  name: string,
): Promise<Counter | null> {
  return db
    .prepare(
      'SELECT visit, visitor FROM counters WHERE namespace = ?1 AND name = ?2',
    )
    .bind(namespace, name)
    .first<Counter>();
}

export async function recordVisit(
  db: D1Database,
  namespace: string,
  name: string,
  fingerprint: Uint8Array | null,
): Promise<Counter> {
  const id = crypto.randomUUID();
  const statements = [
    db
      .prepare(
        `INSERT INTO counters (id, namespace, name, visit, visitor)
         VALUES (?1, ?2, ?3, 1, ?4 IS NOT NULL)
         ON CONFLICT (namespace, name) DO UPDATE SET
           visit = counters.visit + 1,
           visitor = counters.visitor + (
             ?4 IS NOT NULL AND NOT EXISTS (
               SELECT 1 FROM visitors
               WHERE counter_id = counters.id AND fingerprint = ?4
             )
           )
         RETURNING visit, visitor`,
      )
      .bind(id, namespace, name, fingerprint),
  ];

  if (fingerprint !== null) {
    statements.push(
      db
        .prepare(
          `INSERT INTO visitors (counter_id, fingerprint)
           SELECT id, ?3 FROM counters WHERE namespace = ?1 AND name = ?2
           ON CONFLICT (counter_id, fingerprint) DO NOTHING`,
        )
        .bind(namespace, name, fingerprint),
    );
  }

  const [result] = await db.batch<Counter>(statements);
  const counter = result?.results[0];

  // 写入成功必须返回一行。违反契约时按内部错误处理。
  if (counter === undefined) {
    throw new Error('D1 did not return the recorded counter');
  }

  return counter;
}
