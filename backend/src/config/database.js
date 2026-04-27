const { Pool } = require('pg');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'playmatch',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

    this.testConnection();
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✅ Conectado ao PostgreSQL com sucesso!');
      console.log('📊 Hora do servidor:', result.rows[0].now);
      client.release();
    } catch (error) {
      console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
      console.log('💡 Verifique se:');
      console.log('   1. PostgreSQL está rodando');
      console.log('   2. O banco "playmatch" existe');
      console.log('   3. As credenciais no .env estão corretas');
    }
  }

  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Erro na query:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async run(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return { 
        id: result.rows[0]?.id, 
        changes: result.rowCount 
      };
    } catch (error) {
      console.error('Erro na execução:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }
}

module.exports = new Database();