const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW() AS data_atual;');
    console.log('Conectado! Data atual do servidor:', res.rows[0].data_atual);
  } catch (err) {
    console.error('Erro ao conectar:', err);
  } finally {
    await pool.end();
  }
})();