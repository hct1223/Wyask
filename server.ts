import express from 'express';
import path from 'node:path';
import type { FilterGroup, SurveySubmissionPayload } from './src/types/survey.ts';
import {
  clearAdminSessionCookie,
  getRequestAdmin,
  setAdminSessionCookie,
  signAdminToken,
  verifyAdminCredentials,
} from './server/adminAuth.ts';
import { surveyStore } from './server/store.ts';

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '1mb' }));

const sseClients = new Set<express.Response>();

function broadcastUpdate(eventName: string, data: unknown) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const admin = getRequestAdmin(req);
  if (!admin) {
    res.status(401).json({ message: '请先登录管理员账号' });
    return;
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', counts: surveyStore.getCounts() });
});

// Admin Auth Endpoints
app.get('/api/admin/me', (req, res) => {
  const admin = getRequestAdmin(req);
  if (!admin) {
    res.json({ authenticated: false, username: null });
    return;
  }
  res.json({ authenticated: true, username: admin.username });
});

app.post('/api/admin/login', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!verifyAdminCredentials(username, password)) {
    res.status(401).json({ message: '管理员账号或密码错误' });
    return;
  }
  const token = signAdminToken(username.trim());
  setAdminSessionCookie(res, token);
  res.json({ ok: true, token, username: username.trim() });
});

app.post('/api/admin/logout', (_req, res) => {
  clearAdminSessionCookie(res);
  res.json({ ok: true });
});

// Admin Survey CRUD Endpoints
app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  const plan = typeof req.query.plan === 'string' ? req.query.plan : 'all';
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const result = surveyStore.querySubmissions({
    plan,
    search,
    sort,
    limit,
    offset,
    includeSensitive: true,
  });
  res.json(result);
});

app.get('/api/admin/submissions/:id', requireAdmin, (req, res) => {
  const found = surveyStore.getById(req.params.id, true);
  if (!found) {
    res.status(404).json({ message: '未找到该问卷记录' });
    return;
  }
  res.json(found);
});

app.post('/api/admin/submissions', requireAdmin, (req, res) => {
  const payload = req.body as SurveySubmissionPayload;
  const result = surveyStore.createSubmission(payload);
  if (!result.ok) {
    res.status(result.status).json({
      message: result.message,
      existing: result.existing,
    });
    return;
  }
  broadcastUpdate('submission_created', {
    submission: result.submission,
    counts: surveyStore.getCounts(),
  });
  res.status(201).json(result.rawSubmission);
});

app.put('/api/admin/submissions/:id', requireAdmin, (req, res) => {
  const payload = req.body as SurveySubmissionPayload;
  const result = surveyStore.updateSubmission(req.params.id, payload);
  if (!result.ok) {
    res.status(result.status).json({ message: result.message });
    return;
  }
  broadcastUpdate('submission_updated', {
    submission: result.submission,
    counts: surveyStore.getCounts(),
  });
  res.json(result.rawSubmission);
});

app.delete('/api/admin/submissions/:id', requireAdmin, (req, res) => {
  const result = surveyStore.deleteSubmission(req.params.id);
  if (!result.ok) {
    res.status(result.status).json({ message: result.message });
    return;
  }
  broadcastUpdate('submission_deleted', {
    id: result.deletedId,
    counts: surveyStore.getCounts(),
  });
  res.json({ ok: true, id: result.deletedId });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

app.get('/api/submissions', (req, res) => {
  const plan = typeof req.query.plan === 'string' ? req.query.plan : 'all';
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const result = surveyStore.querySubmissions({ plan, search, sort, limit, offset });
  res.json(result);
});

app.get('/api/submissions/check', (req, res) => {
  const room = typeof req.query.room === 'string' ? req.query.room : '';
  if (!room.trim()) {
    res.json({ exists: false });
    return;
  }
  const existing = surveyStore.findByRoom(room);
  res.json({ exists: Boolean(existing), existing: existing || null });
});

app.get('/api/submissions/:id', (req, res) => {
  const found = surveyStore.getById(req.params.id);
  if (!found) {
    res.status(404).json({ message: '未找到该问卷提交记录' });
    return;
  }
  res.json(found);
});

app.post('/api/submissions', (req, res) => {
  const payload = req.body as SurveySubmissionPayload;
  const result = surveyStore.createSubmission(payload);
  if (!result.ok) {
    res.status(result.status).json({
      message: result.message,
      existing: result.existing,
    });
    return;
  }

  broadcastUpdate('submission_created', {
    submission: result.submission,
    counts: surveyStore.getCounts(),
  });

  res.status(201).json(result.submission);
});

app.get('/api/stats', (req, res) => {
  const raw = typeof req.query.arrears === 'string' ? req.query.arrears : 'all';
  const filterGroup: FilterGroup =
    raw === 'none' || raw === 'exist' ? raw : 'all';
  res.json(surveyStore.computeStats(filterGroup));
});

app.get('/api/export/csv', (req, res) => {
  const raw = typeof req.query.arrears === 'string' ? req.query.arrears : 'all';
  const filterGroup: FilterGroup =
    raw === 'none' || raw === 'exist' ? raw : 'all';
  const csv = surveyStore.toCsv(filterGroup);
  const tag =
    filterGroup === 'none' ? '无欠费组' : filterGroup === 'exist' ? '欠费户组' : '全小区';
  const filename = encodeURIComponent(`利安花园业主表决答卷明细_${tag}.csv`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
  res.send(csv);
});

// Ensure unmatched /api/* routes always return JSON instead of falling through to SPA HTML
app.use('/api', (_req, res) => {
  res.status(404).json({ message: '请求的 API 接口不存在' });
});

// Ensure API errors (such as malformed JSON payloads) always return JSON
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.path.startsWith('/api')) {
      const status =
        typeof (err as { status?: unknown })?.status === 'number'
          ? (err as { status: number }).status
          : 500;
      const message = err instanceof Error ? err.message : '服务器处理请求失败';
      res.status(status).json({ message });
      return;
    }
    next(err);
  }
);

async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
