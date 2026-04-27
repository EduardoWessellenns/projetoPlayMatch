// src/models/Match.js
const pool = require('../config/database');

class Match {
  static async create(matchData) {
    const { sport_id, organizer_id, title, description, match_date, location, max_players } = matchData;
    const query = `
      INSERT INTO matches (sport_id, organizer_id, title, description, match_date, location, max_players, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendada') 
      RETURNING *
    `;
    const values = [sport_id, organizer_id, title, description, match_date, location, max_players];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT m.*, s.name as sport_name, u.username as organizer_name,
             COUNT(mp.user_id) as current_players
      FROM matches m
      LEFT JOIN sports s ON m.sport_id = s.id
      LEFT JOIN users u ON m.organizer_id = u.id
      LEFT JOIN match_participants mp ON m.id = mp.match_id AND mp.status = 'confirmado'
      WHERE m.status = 'agendada'
      GROUP BY m.id, s.name, u.username
      ORDER BY m.match_date ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findByUserId(userId) {
    const query = `
      SELECT m.*, s.name as sport_name, u.username as organizer_name,
             COUNT(mp.user_id) as current_players,
             mp.status as participation_status
      FROM matches m
      LEFT JOIN sports s ON m.sport_id = s.id
      LEFT JOIN users u ON m.organizer_id = u.id
      LEFT JOIN match_participants mp ON m.id = mp.match_id
      WHERE mp.user_id = $1
      GROUP BY m.id, s.name, u.username, mp.status
      ORDER BY m.match_date DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async addParticipant(matchId, userId, role = 'jogador') {
    const query = `
      INSERT INTO match_participants (match_id, user_id, role, status) 
      VALUES ($1, $2, $3, 'confirmado')
      RETURNING *
    `;
    const values = [matchId, userId, role];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Match;