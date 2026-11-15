import crypto from 'node:crypto';
import type express from 'express';

export const ADMIN_COOKIE_NAME = 'lian_admin_session';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'root';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

function getAdminSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.OAUTH_SESSION_SECRET ||
    'lian-garden-admin-session-secret-2025'
  );
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function signAdminToken(username: string): string {
  const payload = {
    username,
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAdminSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAdminToken(token: string | undefined): { username: string } | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expected = crypto
    .createHmac('sha256', getAdminSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as {
      username?: string;
      role?: string;
      exp?: number;
    };
    if (parsed.role !== 'admin' || !parsed.username || (parsed.exp && Date.now() > parsed.exp)) {
      return null;
    }
    return { username: parsed.username };
  } catch {
    return null;
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export function getRequestAdmin(req: express.Request): { username: string } | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    const admin = verifyAdminToken(bearer);
    if (admin) return admin;
  }
  const cookies = parseCookies(req.headers.cookie);
  return verifyAdminToken(cookies[ADMIN_COOKIE_NAME]);
}

export function setAdminSessionCookie(res: express.Response, token: string) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAdminSessionCookie(res: express.Response) {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
}
