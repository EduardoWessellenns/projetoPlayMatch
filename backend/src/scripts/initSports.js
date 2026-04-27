const db = require('../config/database');

async function initSports() {
  try {
    // Verificar se já existem esportes
    const existingSports = await db.query('SELECT name FROM sports');
    
    const sports = ['Futebol', 'Vôlei', 'Basquete', 'Tênis', 'Natação'];
    
    for (const sport of sports) {
      // Verificar se o esporte já existe
      const exists = existingSports.some(s => s.name === sport);
      
      if (!exists) {
        await db.run(
          'INSERT INTO sports (name) VALUES ($1)',
          [sport]
        );
        console.log(`✅ Esporte "${sport}" inserido`);
      } else {
        console.log(`ℹ️  Esporte "${sport}" já existe`);
      }
    }
    
    console.log('🎯 Esportes padrão configurados!');
  } catch (error) {
    console.error('❌ Erro ao inserir esportes:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initSports();
}

module.exports = initSports;