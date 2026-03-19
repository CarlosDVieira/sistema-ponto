require('dotenv').config();
const app        = require('./app');
const { connectDB }    = require('./config/database');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`\n╔══════════════════════════════════════╗`);
      console.log(`║   PontoFácil API — rodando na :${PORT}   ║`);
      console.log(`╚══════════════════════════════════════╝\n`);
    });
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();
