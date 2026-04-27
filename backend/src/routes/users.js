const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// GET /api/users/profile - Perfil do usuário
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Contar partidas jogadas
    const matchesCount = await db.query(
      `SELECT COUNT(*) as count FROM match_participants 
       WHERE user_id = ? AND status = 'confirmado'`,
      [req.user.userId]
    );

    res.json({
      success: true,
      user: {
        ...users[0],
        matches_played: matchesCount[0].count
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil'
    });
  }
});

// PUT /api/users/profile - Atualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário e email são obrigatórios'
      });
    }

    // Verificar se email/username já existe em outro usuário
    const existingUser = await db.query(
      'SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?',
      [email, username, req.user.userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email ou nome de usuário já está em uso'
      });
    }

    await db.run(
      'UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, email, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil'
    });
  }
});

module.exports = router;