const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app = express();

// ── SEGURANÇA ─────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.APP_URL : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limit global — 200 req/min por IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' }
}));

// Rate limit rigoroso para login — 10 tentativas/min
app.use('/api/auth/login', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Aguarde 1 minuto.' }
}));

// ── MIDDLEWARES ───────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve uploads (fotos)
app.use('/uploads', express.static(path.join(process.env.UPLOAD_DIR || './uploads')));

// ── ROTAS ─────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/empresas',    require('./routes/empresas'));
app.use('/api/usuarios',    require('./routes/usuarios'));
app.use('/api/departamentos', require('./routes/departamentos'));
app.use('/api/ponto',       require('./routes/ponto'));
app.use('/api/relatorios',  require('./routes/relatorios'));

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ── ERRO GLOBAL ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor.' });
});

module.exports = app;
