const { Pool } = require('pg');
const config = require('./config');

// Crear pool de conexiones PostgreSQL
const pool = new Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    ssl: {
        rejectUnauthorized: false
    }
});

// Probar conexión
pool.on('connect', () => {
    console.log('✅ Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
    console.error('❌ Error en la conexión de PostgreSQL:', err);
});

module.exports = pool;
