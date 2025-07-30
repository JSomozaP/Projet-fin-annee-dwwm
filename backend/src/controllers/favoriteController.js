const { Favorite } = require('../models');
const twitchService = require('../services/twitchService');

class FavoriteController {
  // Ajouter un stream aux favoris
  async addFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { streamerId, streamerName, gameId, gameName } = req.body;

      if (!streamerId || !streamerName) {
        return res.status(400).json({
          success: false,
          message: 'streamerId et streamerName sont requis'
        });
      }

      console.log('➕ Ajout aux favoris:', {
        userId,
        streamerId,
        streamerName,
        gameId,
        gameName
      });

      // Vérifier si déjà en favoris
      const existingFavorite = await Favorite.findByUserAndStreamer(userId, streamerId);
      if (existingFavorite) {
        return res.status(409).json({
          success: false,
          message: 'Ce streamer est déjà dans vos favoris'
        });
      }

      // Créer le favori
      const favorite = await Favorite.create({
        userId,
        streamerId,
        streamerName,
        gameId: gameId || null,
        gameName: gameName || null
      });

      res.status(201).json({
        success: true,
        data: favorite,
        message: 'Streamer ajouté aux favoris avec succès'
      });
    } catch (error) {
      console.error('Erreur dans addFavorite:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout aux favoris',
        error: error.message
      });
    }
  }

  // Supprimer un stream des favoris
  async removeFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { streamerId } = req.params;

      console.log('➖ Suppression des favoris:', { userId, streamerId });

      const deleted = await Favorite.deleteByUserAndStreamer(userId, streamerId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Favori non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Streamer retiré des favoris avec succès'
      });
    } catch (error) {
      console.error('Erreur dans removeFavorite:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du favori',
        error: error.message
      });
    }
  }

  // Obtenir tous les favoris d'un utilisateur
  async getFavorites(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      console.log('📋 Récupération des favoris:', { 
        userId, 
        page: parseInt(page), 
        limit: parseInt(limit) 
      });

      const favorites = await Favorite.findByUserId(userId, {
        limit: parseInt(limit)
      });

      // Pour l'instant, retourner les favoris simples sans enrichissement
      // L'enrichissement sera fait dans un endpoint séparé
      res.json({
        success: true,
        data: favorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: favorites.length
        },
        message: 'Favoris récupérés avec succès'
      });
    } catch (error) {
      console.error('Erreur dans getFavorites:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des favoris',
        error: error.message
      });
    }
  }

  // Vérifier si un streamer est dans les favoris
  async checkFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { streamerId } = req.params;

      const favorite = await Favorite.findByUserAndStreamer(userId, streamerId);

      res.json({
        success: true,
        data: {
          isFavorite: !!favorite,
          favorite: favorite || null
        }
      });
    } catch (error) {
      console.error('Erreur dans checkFavorite:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du favori',
        error: error.message
      });
    }
  }

  // Obtenir les streamers favoris actuellement en live
  async getLiveFavorites(req, res) {
    try {
      const userId = req.user.id;

      console.log('🔴 Récupération des favoris en live:', { userId });

      const favorites = await Favorite.findByUserId(userId);
      const liveStreams = [];

      // Vérifier le statut de chaque favori
      await Promise.all(
        favorites.map(async (favorite) => {
          try {
            const streamInfo = await twitchService.getStreamerInfo(favorite.streamerId);
            if (streamInfo && streamInfo.isLive) {
              liveStreams.push({
                ...favorite,
                currentStream: streamInfo
              });
            }
          } catch (error) {
            console.log(`Erreur vérification live pour ${favorite.streamerName}:`, error.message);
          }
        })
      );

      res.json({
        success: true,
        data: liveStreams,
        message: `${liveStreams.length} favoris actuellement en live`
      });
    } catch (error) {
      console.error('Erreur dans getLiveFavorites:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des favoris en live',
        error: error.message
      });
    }
  }

  // Obtenir les statistiques des favoris
  async getFavoriteStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Favorite.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'Statistiques des favoris récupérées'
      });
    } catch (error) {
      console.error('Erreur dans getFavoriteStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

module.exports = new FavoriteController();
