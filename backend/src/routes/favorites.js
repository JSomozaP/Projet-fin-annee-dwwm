const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

// Toutes les routes de favoris nécessitent une authentification
router.use(authenticateToken);

// POST /api/favorites - Ajouter un streamer aux favoris
router.post('/', favoriteController.addFavorite);

// DELETE /api/favorites/:streamerId - Supprimer un streamer des favoris
router.delete('/:streamerId', favoriteController.removeFavorite);

// GET /api/favorites - Obtenir tous les favoris de l'utilisateur
router.get('/', favoriteController.getFavorites);

// GET /api/favorites/live - Obtenir les favoris actuellement en live
router.get('/live', favoriteController.getLiveFavorites);

// GET /api/favorites/stats - Obtenir les statistiques des favoris
router.get('/stats', favoriteController.getFavoriteStats);

// GET /api/favorites/check/:streamerId - Vérifier si un streamer est favori
router.get('/check/:streamerId', favoriteController.checkFavorite);

module.exports = router;
