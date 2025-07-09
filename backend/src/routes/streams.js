const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');

// GET /api/streams/random - Obtenir un stream aléatoire
router.get('/random', streamController.getRandomStream);

// GET /api/streams - Obtenir tous les streams avec filtres
router.get('/', streamController.getStreams);

// GET /api/streams/search-game - Rechercher un jeu
router.get('/search-game', streamController.searchGame);

module.exports = router;
