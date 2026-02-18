// Configuración de producción con PostgreSQL (Supabase Database)
module.exports = {
    PORT: 3002,
    DB_HOST: process.env.DB_HOST || 'aws-1-us-east-1.pooler.supabase.com',
    DB_PORT: process.env.DB_PORT || 5432,
    DB_NAME: process.env.DB_NAME || 'postgres',
    DB_USER: process.env.DB_USER || 'postgres.erkleeiyaokrqlntwply',
    DB_PASSWORD: process.env.DB_PASSWORD || 'qttX89r0HCW7u2vl',
    url: 'https://a3syscom.com/stree/api'
};