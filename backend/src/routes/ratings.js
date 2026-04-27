const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// POST /api/ratings - Avaliar outro jogador
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { rated_user_id, match_id, punctuality_rating, fairplay_rating, comments } = req.body;

    // Validações
    if (!rated_user_id || !match_id || !punctuality_rating || !fairplay_rating) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos de avaliação são obrigatórios'
      });
    }

    if (rated_user_id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode se avaliar'
      });
    }

    // Verificar se ambos participaram da partida
    const participants = await db.query(
      `SELECT * FROM match_participants 
       WHERE match_id = ? AND user_id IN (?, ?) AND status = 'confirmado'`,
      [match_id, req.user.userId, rated_user_id]
    );

    if (participants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Apenas participantes confirmados da partida podem ser avaliados'
      });
    }

    // Verificar se já avaliou este usuário nesta partida
    const existingRating = await db.query(
      'SELECT * FROM user_ratings WHERE rater_id = ? AND rated_id = ? AND match_id = ?',
      [req.user.userId, rated_user_id, match_id]
    );

    if (existingRating.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Você já avaliou este usuário para esta partida'
      });
    }

    // Inserir avaliação
    await db.run(
      `INSERT INTO user_ratings 
      (rater_id, rated_id, match_id, punctuality_rating, fairplay_rating, comments) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.userId, rated_user_id, match_id, punctuality_rating, fairplay_rating, comments || '']
    );

    // Atualizar rating médio do usuário avaliado
    await updateUserRating(rated_user_id);

    res.json({
      success: true,
      message: 'Avaliação registrada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao registrar avaliação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar avaliação'
    });
  }
});

// GET /api/ratings/user/:userId - Buscar avaliações de um usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await db.query(`
      SELECT ur.*, u.username as rater_name, m.title as match_title
      FROM user_ratings ur
      LEFT JOIN users u ON ur.rater_id = u.id
      LEFT JOIN matches m ON ur.match_id = m.id
      WHERE ur.rated_id = ?
      ORDER BY ur.created_at DESC
    `, [userId]);

    // Calcular médias
    const averages = await db.query(`
      SELECT 
        AVG(punctuality_rating) as avg_punctuality,
        AVG(fairplay_rating) as avg_fairplay,
        COUNT(*) as total_ratings
      FROM user_ratings 
      WHERE rated_id = ?
    `, [userId]);

    res.json({
      success: true,
      ratings,
      averages: averages[0] || { avg_punctuality: 0, avg_fairplay: 0, total_ratings: 0 }
    });

  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar avaliações'
    });
  }
});

// Função para atualizar rating do usuário
async function updateUserRating(userId) {
  const averages = await db.query(`
    SELECT 
      AVG((punctuality_rating + fairplay_rating) / 2) as overall_avg,
      COUNT(*) as total_ratings
    FROM user_ratings 
    WHERE rated_id = ?
  `, [userId]);

  if (averages[0].overall_avg) {
    await db.run(
      'UPDATE users SET rating = ?, total_ratings = ? WHERE id = ?',
      [parseFloat(averages[0].overall_avg), averages[0].total_ratings, userId]
    );
  }
}

module.exports = router;