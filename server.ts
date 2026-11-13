import express from 'express';
import path from 'node:path';
import type { FilterGroup, SurveySubmissionPayload } from './src/types/survey.ts';
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', counts: surveyStore.getCounts() });
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

app.get('/api/export/csv', (_req, res) => {
  const csv = surveyStore.toCsv();
  const filename = encodeURIComponent('利安花园业主表决问卷明细导出.csv');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
  res.send(csv);
});

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
