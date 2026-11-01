import { asNum, asStr, ensureAppSchema, getAppDb, nowIso } from "./appDb";

/* There is no RLS: routes and tools gate on these lookups before they build a Scope. */

export type FilingMemberRole = "owner";

export interface FilingRow {
  id: string;
  taxYear: number;
  status: string;
  createdAt: string;
}

/* Throws unless exactly one exists: never pick a filing silently. */
export async function resolveOwnerFilingForYear(
  userId: string,
  taxYear: number,
): Promise<FilingRow> {
  await ensureAppSchema();
  const res = await getAppDb().execute({
    sql: `SELECT f.id, f.tax_year, f.status, f.created_at
          FROM filings f
          JOIN filing_members m ON m.filing_id = f.id
          WHERE m.user_id = ? AND m.role = 'owner' AND m.revoked_at IS NULL
            AND f.tax_year = ?`,
    args: [userId, taxYear],
  });
  if (res.rows.length === 0) {
    throw new Error(
      `No owner filing found for tax_year=${taxYear}. Run npm run db:seed (seedLocal.ts).`,
    );
  }
  if (res.rows.length > 1) {
    throw new Error(
      `Multiple owner filings for tax_year=${taxYear} (${res.rows.length}); ambiguous.`,
    );
  }
  const row = res.rows[0];
  return {
    id: asStr(row.id),
    taxYear: asNum(row.tax_year),
    status: asStr(row.status),
    createdAt: asStr(row.created_at),
  };
}

/** The routes' 403/404 gate. */
export async function getMembership(
  filingId: string,
  userId: string,
  role: FilingMemberRole,
): Promise<{ filingId: string; taxYear: number } | null> {
  await ensureAppSchema();
  const res = await getAppDb().execute({
    sql: `SELECT f.id, f.tax_year
          FROM filings f
          JOIN filing_members m ON m.filing_id = f.id
          WHERE f.id = ? AND m.user_id = ? AND m.role = ? AND m.revoked_at IS NULL
          LIMIT 1`,
    args: [filingId, userId, role],
  });
  const row = res.rows[0];
  return row ? { filingId: asStr(row.id), taxYear: asNum(row.tax_year) } : null;
}

export async function createOwnerFiling(args: {
  filingId: string;
  userId: string;
  taxYear: number;
  status?: string;
}): Promise<void> {
  await ensureAppSchema();
  const db = getAppDb();
  await db.batch(
    [
      {
        sql: `INSERT INTO filings (id, tax_year, status, created_at) VALUES (?, ?, ?, ?)`,
        args: [args.filingId, args.taxYear, args.status ?? "draft", nowIso()],
      },
      {
        sql: `INSERT INTO filing_members (filing_id, user_id, role, added_at) VALUES (?, ?, 'owner', ?)`,
        args: [args.filingId, args.userId, nowIso()],
      },
    ],
    "write",
  );
}

/** Clears every domain row of the filing. The caller must verify ownership first. */
export async function deleteFilingCascade(filingId: string): Promise<void> {
  await ensureAppSchema();
  const db = getAppDb();
  /* ensureAppSchema turned foreign_keys ON for this connection, so the cascade fires. */
  await db.execute({ sql: `DELETE FROM filings WHERE id = ?`, args: [filingId] });
}
