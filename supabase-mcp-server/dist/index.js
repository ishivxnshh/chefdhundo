"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config();
const app = (0, express_1.default)();
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
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
function requireApiKey(req, res, next) {
    var _a;
    const provided = req.header('x-mcp-api-key') || ((_a = req.header('authorization')) === null || _a === void 0 ? void 0 : _a.replace(/^Bearer\s+/i, ''));
    if (!provided || provided !== apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
}
function validateTable(table) {
    return typeof table === 'string' && allowedTables.has(table);
}
function validateSelect(select) {
    return typeof select === 'string' && select.length <= 500 && safeSelectPattern.test(select);
}
app.use((0, cors_1.default)({ origin: allowedOrigin, credentials: false }));
app.use(requireApiKey);
app.use(body_parser_1.default.json({ limit: '64kb' }));
app.use((error, _req, res, next) => {
    if (error instanceof SyntaxError) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    return next(error);
});
app.post('/query', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, table, limit } = req.body;
    if (!validateTable(table) || !validateSelect(query)) {
        return res.status(400).json({ error: 'Invalid table or select expression.' });
    }
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    try {
        const { data, error } = yield supabase.from(table).select(query).limit(safeLimit);
        if (error)
            throw error;
        return res.json({ data });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Query failed';
        return res.status(500).json({ error: message });
    }
}));
app.get('/table-counts', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const counts = {};
        for (const table of allowedTables) {
            const { count, error } = yield supabase
                .from(table)
                .select('id', { count: 'exact', head: true });
            counts[table] = error ? `Error: ${error.message}` : count || 0;
        }
        return res.json({ data: counts });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Count lookup failed';
        return res.status(500).json({ error: message });
    }
}));
app.listen(port, () => {
    console.log(`Supabase MCP server is running on http://localhost:${port}`);
});
