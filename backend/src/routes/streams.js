const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');

// GET /api/streams/discover - Découvrir un stream intelligent
router.get('/discover', streamController.discoverStream);

// GET /api/streams/random - Obtenir un stream aléatoire
router.get('/random', streamController.getRandomStream);

// GET /api/streams - Obtenir tous les streams avec filtres
router.get('/', streamController.getStreams);

// GET /api/streams/search-game - Rechercher un jeu
router.get('/search-game', streamController.searchGame);

// POST /api/streams/cache/refresh - Rafraîchir le cache
router.post('/cache/refresh', streamController.refreshCache);

// GET /api/streams/cache/stats - Statistiques du cache
router.get('/cache/stats', streamController.getCacheStats);

module.exports = router;
