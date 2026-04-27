const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/locations/reverse-geocode - Geocoding reverso
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude e longitude são obrigatórias'
      });
    }

    // Simulação de geocoding reverso
    const address = `Localização: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;

    res.json({
      success: true,
      address: {
        address: address,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      }
    });
  } catch (error) {
    console.error('Erro no reverse geocoding:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar endereço'
    });
  }
});

// POST /api/locations/geocode - Geocoding direto
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Endereço é obrigatório'
      });
    }

    // Simulação de geocoding
    const mockLocation = {
      latitude: -23.5505,
      longitude: -46.6333,
      address: `Resultado para: ${address}`
    };

    res.json({
      success: true,
      location: mockLocation
    });
  } catch (error) {
    console.error('Erro no geocoding:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao geocodificar endereço'
    });
  }
});

module.exports = router;