import { asStr, ensureAppSchema, getAppDb } from "./appDb";

/* Cade only reads users: the web app writes the rows. */

export interface User {
  id: string;
  email: string;
  displayName: string;
}

type UserRow = Record<string, unknown>;

const toUser = (row: UserRow): User => ({
  id: asStr(row.id),
  email: asStr(row.email),
  displayName: asStr(row.display_name),
});

export async function getUserById(id: string): Promise<User | null> {
  await ensureAppSchema();
  const res = await getAppDb().execute({
    sql: `SELECT id, email, display_name FROM users WHERE id = ?`,
    args: [id],
  });
  const row = res.rows[0];
  return row ? toUser(row) : null;
}

/* The user of a local instance. Null when there is no user, and when there is more than one. */
export async function getOnlyUser(): Promise<User | null> {
  await ensureAppSchema();
  const res = await getAppDb().execute(`SELECT id, email, display_name FROM users LIMIT 2`);
  return res.rows.length === 1 ? toUser(res.rows[0]) : null;
}
