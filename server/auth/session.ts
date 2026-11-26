import { neon } from '@neondatabase/serverless';
import type { UserProfile } from '../types.js';

export async function verifiedUser(token: string): Promise<UserProfile | null> {
  if (!process.env.DATABASE_URL || !token || token.length > 512) return null;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.image, u."createdAt", u."emailVerified"
    FROM neon_auth.session s
    JOIN neon_auth."user" u ON u.id = s."userId"
    WHERE s.token = ${token} AND s."expiresAt" > now() AND u.banned IS NOT TRUE
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.image || undefined,
    role: row.email === 'samuelcollridgenaik@gmail.com' && row.emailVerified ? 'faculty' : 'student',
    createdAt: new Date(row.createdAt).toISOString(),
  };
}
