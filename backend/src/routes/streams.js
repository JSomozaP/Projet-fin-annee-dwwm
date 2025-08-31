const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const auth = require('../middleware/auth');

// GET /api/streams/discover - Découvrir un stream intelligent
router.get('/discover', auth.optionalAuth, streamController.discoverStream);

// GET /api/streams/random - Obtenir un stream aléatoire
router.get('/random', auth.optionalAuth, streamController.getRandomStream);

// GET /api/streams - Obtenir tous les streams avec filtres
router.get('/', auth.optionalAuth, streamController.getStreams);

// GET /api/streams/search-game - Rechercher un jeu
router.get('/search-game', streamController.searchGame);

// GET /api/streams/search-streamer/:streamerName - Rechercher un streamer spécifique
router.get('/search-streamer/:streamerName', streamController.searchStreamer);

// GET /api/streams/games/search - Rechercher des jeux par nom (nouvelle route)
router.get('/games/search', streamController.searchGames);

// POST /api/streams/cache/refresh - Rafraîchir le cache
router.post('/cache/refresh', streamController.refreshCache);

// GET /api/streams/cache/stats - Statistiques du cache
router.get('/cache/stats', streamController.getCacheStats);

// POST /api/streams/cache/update-games - Mettre à jour le cache des jeux populaires
router.post('/cache/update-games', streamController.updateGameCache);

module.exports = router;
