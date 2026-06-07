import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const apiKey = process.env.MCP_API_KEY;
const allowedOrigin = process.env.MCP_ALLOWED_ORIGIN || 'http://localhost:3000';
const allowedTables = new Set(['users', 'resumes', 'payments', 'subscriptions', 'announcements']);
const safeSelectPattern = /^[a-zA-Z0-9_*,.()\s-]+$/;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and anon key are required.');
}

if (!apiKey) {
  throw new Error('MCP_API_KEY is required before starting this server.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const provided = req.header('x-mcp-api-key') || req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!provided || provided !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

function validateTable(table: unknown) {
  return typeof table === 'string' && allowedTables.has(table);
}

function validateSelect(select: unknown) {
  return typeof select === 'string' && select.length <= 500 && safeSelectPattern.test(select);
}

app.use(cors({ origin: allowedOrigin, credentials: false }));
app.use(requireApiKey);
app.use(bodyParser.json({ limit: '64kb' }));
app.use((error: Error, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  return next(error);
});

app.post('/query', async (req, res) => {
  const { query, table, limit } = req.body;

  if (!validateTable(table) || !validateSelect(query)) {
    return res.status(400).json({ error: 'Invalid table or select expression.' });
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  try {
    const { data, error } = await supabase.from(table).select(query).limit(safeLimit);
    if (error) throw error;
    return res.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query failed';
    return res.status(500).json({ error: message });
  }
});

app.get('/table-counts', async (_req, res) => {
  try {
    const counts: Record<string, number | string> = {};

    for (const table of allowedTables) {
      const { count, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });

      counts[table] = error ? `Error: ${error.message}` : count || 0;
    }

    return res.json({ data: counts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Count lookup failed';
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Supabase MCP server is running on http://localhost:${port}`);
});
