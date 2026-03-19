const { createClient } = require('redis');

let client;

async function connectRedis() {
  client = createClient({
    socket: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
    },
    password: process.env.REDIS_PASS,
  });

  client.on('error', (err) => console.error('Redis erro:', err));
  client.on('reconnecting', () => console.warn('Redis reconectando...'));

  await client.connect();
  console.log('✓ Redis conectado');
}

function getRedis() {
  if (!client) throw new Error('Redis não conectado.');
  return client;
}

// ── HELPERS ───────────────────────────────────────────────

// Sessão JWT (token na blacklist ao fazer logout)
async function blacklistToken(token, expiresIn = 28800) {
  await getRedis().set(`blacklist:${token}`, '1', { EX: expiresIn });
}
async function isTokenBlacklisted(token) {
  return await getRedis().exists(`blacklist:${token}`);
}

// Status online dos colaboradores
async function setOnline(usuarioId, empresaId) {
  const key = `online:${empresaId}:${usuarioId}`;
  await getRedis().set(key, '1', { EX: 300 }); // expira em 5 min
}
async function isOnline(usuarioId, empresaId) {
  return await getRedis().exists(`online:${empresaId}:${usuarioId}`);
}
async function getOnlineList(empresaId) {
  const keys = await getRedis().keys(`online:${empresaId}:*`);
  return keys.map(k => k.split(':')[2]);
}

// Cache de relatórios
async function cacheSet(key, data, ttl = 300) {
  await getRedis().set(`cache:${key}`, JSON.stringify(data), { EX: ttl });
}
async function cacheGet(key) {
  const data = await getRedis().get(`cache:${key}`);
  return data ? JSON.parse(data) : null;
}
async function cacheDel(key) {
  await getRedis().del(`cache:${key}`);
}
async function cacheDelPattern(pattern) {
  const keys = await getRedis().keys(`cache:${pattern}*`);
  if (keys.length) await getRedis().del(keys);
}

// Fila de notificações
async function enqueueNotification(payload) {
  await getRedis().lPush('queue:notifications', JSON.stringify(payload));
}
async function dequeueNotification() {
  const item = await getRedis().rPop('queue:notifications');
  return item ? JSON.parse(item) : null;
}

module.exports = {
  connectRedis, getRedis,
  blacklistToken, isTokenBlacklisted,
  setOnline, isOnline, getOnlineList,
  cacheSet, cacheGet, cacheDel, cacheDelPattern,
  enqueueNotification, dequeueNotification,
};
