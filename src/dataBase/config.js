import pg from 'pg'
import env from 'dotenv'

env.config()

const { Pool } = pg

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

pool.connect()
    .then(() => console.log('Conectado ao banco de dados com sucesso!'))
    .catch((err) => console.error('Erro ao conectar:', err.stack))