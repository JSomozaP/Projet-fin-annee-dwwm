const { Favorite } = require('../models');
const twitchService = require('../services/twitchService');
const questService = require('../services/questService');

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

      // Récupérer l'avatar du streamer depuis l'API Twitch
      let streamerAvatar = null;
      try {
        const streamerInfo = await twitchService.getUserByLogin(streamerName);
        if (streamerInfo && streamerInfo.length > 0) {
          streamerAvatar = streamerInfo[0].profile_image_url;
          console.log('📸 Avatar récupéré pour', streamerName, ':', streamerAvatar);
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer l\'avatar pour', streamerName, ':', error.message);
      }

      // Créer le favori
      const favorite = await Favorite.create({
        userId,
        streamerId,
        streamerName,
        streamerAvatar,
        gameId: gameId || null,
        gameName: gameName || null
      });

      // 🎯 Tracker l'ajout aux favoris pour les quêtes
      try {
        await questService.updateQuestProgress(userId, 'all', {
          action: 'favorite_added',
          streamerId,
          gameId: gameId || null
        });
      } catch (questError) {
        console.log('⚠️ Erreur tracking quête (non bloquant):', questError.message);
      }

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
      const { page = 1, limit = 20, checkLive = 'false' } = req.query;

      console.log('📋 Récupération des favoris:', { 
        userId, 
        page: parseInt(page), 
        limit: parseInt(limit),
        checkLive: checkLive === 'true'
      });

      const favorites = await Favorite.findByUserId(userId, {
        limit: parseInt(limit)
      });

      // Enrichir les favoris avec les informations complètes du streamer
      const enrichedFavorites = [];
      
      // Traiter les favoris séquentiellement pour optimiser le cache
      for (const favorite of favorites) {
        try {
          // Récupérer les informations complètes du streamer
          const streamerInfo = await twitchService.getUserByLogin(favorite.streamerName);
          let streamerData = {};
          
          if (streamerInfo && streamerInfo.length > 0) {
            const streamer = streamerInfo[0];
            streamerData = {
              displayName: streamer.display_name,
              description: streamer.description || 'Aucune description',
              profileImageUrl: streamer.profile_image_url,
              viewCount: streamer.view_count,
              followerCount: 0, // L'API Twitch ne donne plus cette info facilement
              createdAt: streamer.created_at
            };
          }

          // Vérifier le statut live si demandé
          let isLive = false;
          let currentGame = null;
          let viewerCount = 0;
          
          if (checkLive === 'true') {
            try {
              const liveStatus = await twitchService.isStreamerLive(favorite.streamerName);
              isLive = liveStatus;
              
              // Si live, récupérer les infos du stream actuel
              if (isLive) {
                const streamInfo = await twitchService.getStreamInfo(favorite.streamerName);
                if (streamInfo) {
                  currentGame = streamInfo.game_name;
                  viewerCount = streamInfo.viewer_count;
                }
              }
            } catch (error) {
              console.warn(`⚠️ Erreur vérification statut live pour ${favorite.streamerName}:`, error.message);
            }
          }

          enrichedFavorites.push({
            ...favorite.toJSON(),
            ...streamerData,
            isLive,
            currentGame,
            viewerCount
          });
        } catch (error) {
          console.warn(`⚠️ Erreur enrichissement favori ${favorite.streamerName}:`, error.message);
          enrichedFavorites.push({
            ...favorite.toJSON(),
            displayName: favorite.streamerName,
            description: 'Informations non disponibles',
            profileImageUrl: favorite.streamerAvatar,
            isLive: false,
            currentGame: null,
            viewerCount: 0
          });
        }
      }

      res.json({
        success: true,
        data: enrichedFavorites,
        pagination: {
          total: favorites.length,
          page: parseInt(page),
          limit: parseInt(limit)
        }
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
