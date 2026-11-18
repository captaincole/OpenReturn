import { appDb } from "@/lib/serverDb";

/*
 * SERVER-ONLY. The people of this instance, in two tables:
 *
 * - users: who a person is. Cade reads this table, so keep its DDL in sync
 *   with cade/src/mastra/db/appDb.ts.
 * - local_logins: the password hash and the cookie secret of a user who signs
 *   in with a password. Only the web app reads it; Cade never sees a secret.
 * - data_notices: who accepted the first-visit notice, and when. Web only.
 *
 * /setup can run before the agent ever boots, so both sides create `users`.
 */

export interface UserRow {
  id: string;
  email: string;
  displayName: string;
}

/* The signed-in person, as every layout and route handler reads it. */
export interface UserSession {
  userId: string;
  email: string;
  displayName: string;
}

export const toSession = (user: UserRow): UserSession => ({
  userId: user.id,
  email: user.email,
  displayName: user.displayName,
});

export interface LocalLogin extends UserRow {
  passwordHash: string;
  sessionSecret: string;
}

const USERS_DDL = `CREATE TABLE IF NOT EXISTS users (
         id            TEXT PRIMARY KEY,
         email         TEXT NOT NULL UNIQUE,
         display_name  TEXT NOT NULL,
         created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
       )`;

const LOCAL_LOGINS_DDL = `CREATE TABLE IF NOT EXISTS local_logins (
         user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
         password_hash  TEXT NOT NULL,
         session_secret TEXT NOT NULL
       )`;

const DATA_NOTICES_DDL = `CREATE TABLE IF NOT EXISTS data_notices (
         user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
         accepted_at TEXT NOT NULL
       )`;

const LOCAL_LOGIN_COLUMNS = `u.id, u.email, u.display_name, l.password_hash, l.session_secret
       FROM local_logins l JOIN users u ON u.id = l.user_id`;

let tablesReady: Promise<unknown> | null = null;
function ensureUserTables() {
  tablesReady ??= appDb().batch([USERS_DDL, LOCAL_LOGINS_DDL, DATA_NOTICES_DDL], "write");
  return tablesReady;
}

const text = (value: unknown): string => (value == null ? "" : String(value));

const toLocalLogin = (row: Record<string, unknown>): LocalLogin => ({
  id: text(row.id),
  email: text(row.email),
  displayName: text(row.display_name),
  passwordHash: text(row.password_hash),
  sessionSecret: text(row.session_secret),
});

const toUserRow = (row: Record<string, unknown>): UserRow => ({
  id: text(row.id),
  email: text(row.email),
  displayName: text(row.display_name),
});

/*
 * Whether a person can sign in with a password. It reads local_logins, not
 * users: a user that Cloudflare Access made has no password, and /login can
 * never let that user in.
 */
export async function hasLocalLogin(): Promise<boolean> {
  await ensureUserTables();
  const res = await appDb().execute(`SELECT 1 FROM local_logins LIMIT 1`);
  return res.rows.length > 0;
}

const nameFromEmail = (email: string): string => email.split("@")[0] || email;

/*
 * The user with this email; the first call makes the row. The caller has
 * proof of the email (lib/accessAuth.ts). Two first requests can arrive
 * together, so the insert steps aside for a row that is already there.
 */
export async function getOrCreateUserByEmail(email: string): Promise<UserRow> {
  await ensureUserTables();
  await appDb().execute({
    sql: `INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(email) DO NOTHING`,
    args: [crypto.randomUUID(), email, nameFromEmail(email), new Date().toISOString()],
  });
  const res = await appDb().execute({
    sql: `SELECT id, email, display_name FROM users WHERE email = ?`,
    args: [email],
  });
  return toUserRow(res.rows[0]);
}

export async function hasAcceptedNotice(userId: string): Promise<boolean> {
  await ensureUserTables();
  const res = await appDb().execute({
    sql: `SELECT 1 FROM data_notices WHERE user_id = ?`,
    args: [userId],
  });
  return res.rows.length > 0;
}

export async function acceptNotice(userId: string): Promise<void> {
  await ensureUserTables();
  await appDb().execute({
    sql: `INSERT INTO data_notices (user_id, accepted_at) VALUES (?, ?)
          ON CONFLICT(user_id) DO NOTHING`,
    args: [userId, new Date().toISOString()],
  });
}

export async function getLocalLogin(userId: string): Promise<LocalLogin | null> {
  await ensureUserTables();
  const res = await appDb().execute({
    sql: `SELECT ${LOCAL_LOGIN_COLUMNS} WHERE u.id = ?`,
    args: [userId],
  });
  const row = res.rows[0];
  return row ? toLocalLogin(row) : null;
}

/*
 * The login screen asks for a password and no name, so it works for an
 * instance with one password user. Null when there is none, or more than one.
 */
export async function getOnlyLocalLogin(): Promise<LocalLogin | null> {
  await ensureUserTables();
  const res = await appDb().execute(`SELECT ${LOCAL_LOGIN_COLUMNS} LIMIT 2`);
  return res.rows.length === 1 ? toLocalLogin(res.rows[0]) : null;
}

export async function insertLocalUser(login: LocalLogin): Promise<void> {
  await ensureUserTables();
  await appDb().batch(
    [
      {
        sql: `INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`,
        args: [login.id, login.email, login.displayName, new Date().toISOString()],
      },
      {
        sql: `INSERT INTO local_logins (user_id, password_hash, session_secret) VALUES (?, ?, ?)`,
        args: [login.id, login.passwordHash, login.sessionSecret],
      },
    ],
    "write",
  );
}
