const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// GET /api/matches - Listar todas as partidas
router.get('/', async (req, res) => {
  try {
    const matches = await db.query(`
      SELECT m.*, s.name as sport_name, u.username as organizer_name
      FROM matches m
      LEFT JOIN sports s ON m.sport_id = s.id
      LEFT JOIN users u ON m.organizer_id = u.id
      ORDER BY m.match_date ASC
    `);

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar partidas'
    });
  }
});

// GET /api/matches/:id - Buscar partida por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const matches = await db.query(`
      SELECT m.*, s.name as sport_name, u.username as organizer_name
      FROM matches m
      LEFT JOIN sports s ON m.sport_id = s.id
      LEFT JOIN users u ON m.organizer_id = u.id
      WHERE m.id = ?
    `, [id]);

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida não encontrada'
      });
    }

    res.json({
      success: true,
      match: matches[0]
    });
  } catch (error) {
    console.error('Erro ao buscar partida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar partida'
    });
  }
});

// POST /api/matches - Criar nova partida
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      sport_id,
      title,
      description,
      match_date,
      location,
      max_players
    } = req.body;

    // Validações básicas
    if (!sport_id || !title || !match_date) {
      return res.status(400).json({
        success: false,
        message: 'Sport, título e data são obrigatórios'
      });
    }

    const result = await db.run(
      `INSERT INTO matches (
        sport_id, organizer_id, title, description, 
        match_date, location, max_players, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sport_id,
        req.user.userId,
        title,
        description || '',
        match_date,
        location || '',
        max_players || 10,
        'agendada'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Partida criada com sucesso!',
      match: {
        id: result.id,
        title,
        match_date,
        location
      }
    });
  } catch (error) {
    console.error('Erro ao criar partida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar partida'
    });
  }
});

module.exports = router;