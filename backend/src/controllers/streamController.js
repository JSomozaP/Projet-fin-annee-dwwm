const twitchService = require('../services/twitchService');
const questService = require('../services/questService');

class StreamController {
  // Découvrir un stream avec la logique intelligente
  async discoverStream(req, res) {
    try {
      const { userId } = req.user || {};
      const { 
        gameId, 
        game, // Support nom de jeu 
        language = 'fr', 
        minViewers = 1, // 1 par défaut pour éviter les streams à 0 viewers
        maxViewers = null,
        excludeIds = []
      } = req.query;

      console.log('🎯 Découverte de stream demandée:', {
        userId,
        gameId,
        game,
        language,
        minViewers,
        maxViewers,
        excludeIds
      });

      // Résoudre l'ID du jeu si un nom est fourni
      let finalGameId = gameId;
      if (game && !gameId) {
        const gameResult = await twitchService.searchGame(game);
        if (gameResult) {
          finalGameId = gameResult.id;
        }
      }

      const stream = await twitchService.discoverStream({
        userId,
        gameId: finalGameId,
        language,
        minViewers: parseInt(minViewers),
        maxViewers: maxViewers ? parseInt(maxViewers) : null,
        excludeIds: Array.isArray(excludeIds) ? excludeIds : excludeIds ? [excludeIds] : []
      });

      if (!stream) {
        return res.json({
          success: false,
          message: 'Aucun stream trouvé avec ces critères'
        });
      }

      // 🎯 Tracker la découverte pour les quêtes
      if (userId) {
        try {
          await questService.updateQuestProgress(userId, 'all', {
            action: 'stream_discovered',
            viewerCount: stream.nbViewers,
            gameId: stream.gameId,
            language: stream.langue
          });
        } catch (questError) {
          console.log('⚠️ Erreur tracking quête (non bloquant):', questError.message);
        }
      }

      res.json({
        success: true,
        data: stream,
        message: 'Stream découvert avec succès'
      });
    } catch (error) {
      console.error('Erreur dans discoverStream:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la découverte du stream',
        error: error.message
      });
    }
  }

  // Obtenir un stream aléatoire (méthode simple)
  async getRandomStream(req, res) {
    try {
      const { gameId, language = 'fr' } = req.query;
      
      console.log('🎲 Stream aléatoire demandé:', { gameId, language });

      // Utiliser la méthode de découverte avec paramètres basiques
      const stream = await twitchService.discoverStream({
        gameId,
        language,
        minViewers: 1
      });

      if (!stream) {
        return res.json({
          success: false,
          message: 'Aucun stream trouvé'
        });
      }

      // 🎯 Tracker la découverte de stream aléatoire pour les quêtes
      const userId = req.user?.id;
      if (userId) {
        try {
          await questService.updateQuestProgress(userId, 'all', {
            action: 'random_stream_discovered',
            viewerCount: stream.nbViewers,
            gameId: stream.gameId,
            language: stream.langue
          });
        } catch (questError) {
          console.log('⚠️ Erreur tracking quête (non bloquant):', questError.message);
        }
      }

      res.json({
        success: true,
        data: stream,
        message: 'Stream aléatoire trouvé'
      });
    } catch (error) {
      console.error('Erreur dans getRandomStream:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du stream aléatoire',
        error: error.message
      });
    }
  }

  // Obtenir la liste des streams avec pagination
  async getStreams(req, res) {
    try {
      const { 
        gameId, 
        language = 'fr', 
        first = 20,
        after
      } = req.query;

      console.log('📺 Liste des streams demandée:', { gameId, language, first, after });

      const streams = await twitchService.getStreams({
        gameId,
        language,
        first: parseInt(first),
        after
      });

      res.json({
        success: true,
        data: streams,
        message: 'Streams récupérés avec succès'
      });
    } catch (error) {
      console.error('Erreur dans getStreams:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des streams',
        error: error.message
      });
    }
  }

  // Rechercher un jeu par nom
  async searchGame(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Paramètre query requis'
        });
      }

      console.log('🔍 Recherche de jeu:', query);

      const game = await twitchService.searchGame(query);

      if (!game) {
        return res.json({
          success: false,
          message: 'Aucun jeu trouvé'
        });
      }

      res.json({
        success: true,
        data: game
      });
    } catch (error) {
      console.error('Erreur dans searchGame:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche du jeu'
      });
    }
  }

  // Rafraîchir le cache des streams
  async refreshCache(req, res) {
    try {
      console.log('🔄 Demande de rafraîchissement du cache...');
      await twitchService.refreshCache();
      
      res.json({
        success: true,
        message: 'Cache rafraîchi avec succès',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur dans refreshCache:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rafraîchissement du cache',
        error: error.message
      });
    }
  }

  // Obtenir les statistiques du cache
  async getCacheStats(req, res) {
    try {
      const stats = await twitchService.getCacheStats();
      const gameCache = require('../services/gameCache');
      
      res.json({
        success: true,
        data: {
          ...stats,
          streamCacheStats: require('../services/streamCacheManager').getCacheStats(),
          gameCacheStats: gameCache.getStats()
        },
        message: 'Statistiques du cache récupérées'
      });
    } catch (error) {
      console.error('Erreur dans getCacheStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }

  // Forcer la mise à jour du cache des jeux populaires (admin)
  async updateGameCache(req, res) {
    try {
      console.log('🔧 Mise à jour forcée du cache des jeux populaires...');
      const gameCache = require('../services/gameCache');
      await gameCache.forceUpdate();
      
      res.json({
        success: true,
        message: 'Cache des jeux populaires mis à jour avec succès',
        data: gameCache.getStats()
      });
    } catch (error) {
      console.error('Erreur dans updateGameCache:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du cache des jeux',
        error: error.message
      });
    }
  }

  // Rechercher des jeux par nom via l'API Twitch
  async searchGames(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'La requête doit contenir au moins 2 caractères'
        });
      }

      console.log('🎮 Recherche de jeux:', { query });

      const games = await twitchService.searchGames(query);
      
      res.json({
        success: true,
        data: games,
        message: 'Jeux trouvés'
      });
    } catch (error) {
      console.error('Erreur dans searchGames:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche de jeux',
        error: error.message
      });
    }
  }

  // Rechercher un streamer spécifique par nom
  async searchStreamer(req, res) {
    try {
      const { streamerName } = req.params;
      
      console.log(`🔍 Recherche du streamer: ${streamerName}`);
      
      if (!streamerName || streamerName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Le nom du streamer est requis'
        });
      }

      // Rechercher l'utilisateur Twitch
      const streamerInfo = await twitchService.getUserByLogin(streamerName.trim());
      
      if (!streamerInfo) {
        console.log(`❌ Streamer "${streamerName}" non trouvé`);
        return res.json({
          success: false,
          message: `Streamer "${streamerName}" non trouvé sur Twitch`
        });
      }

      console.log(`✅ Streamer trouvé: ${streamerInfo.display_name} (ID: ${streamerInfo.id})`);

      // Vérifier si le streamer est en live
      const streamData = await twitchService.isStreamerLive(streamerInfo.id);
      
      let responseData = {
        id: streamerInfo.id,
        user_name: streamerInfo.login,
        user_login: streamerInfo.login,
        display_name: streamerInfo.display_name,
        profile_image_url: streamerInfo.profile_image_url,
        description: streamerInfo.description || 'Aucune description',
        isLive: streamData !== null,
        embedUrl: `https://player.twitch.tv/?channel=${streamerInfo.login}`,
        profileUrl: `https://twitch.tv/${streamerInfo.login}`
      };

      // Si le streamer est en live, ajouter les infos du stream
      if (streamData) {
        responseData = {
          ...responseData,
          title: streamData.title,
          game_name: streamData.game_name,
          game_id: streamData.game_id,
          language: streamData.language,
          viewer_count: streamData.viewer_count,
          thumbnail_url: streamData.thumbnail_url?.replace('{width}', '640').replace('{height}', '360') || '',
          started_at: streamData.started_at,
          type: 'live'
        };
        console.log(`🎮 ${streamerInfo.display_name} est en live: ${streamData.title} (${streamData.viewer_count} viewers)`);
      } else {
        // Si pas en live, données par défaut
        responseData = {
          ...responseData,
          title: `Chaîne de ${streamerInfo.display_name}`,
          game_name: 'Hors ligne',
          game_id: null,
          language: 'fr',
          viewer_count: 0,
          thumbnail_url: streamerInfo.profile_image_url,
          type: 'offline'
        };
        console.log(`💤 ${streamerInfo.display_name} n'est pas en live`);
      }

      res.json({
        success: true,
        data: responseData,
        message: streamData ? `${streamerName} est actuellement en live !` : `${streamerName} trouvé mais n'est pas en live.`
      });

    } catch (error) {
      console.error('❌ Erreur dans searchStreamer:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche du streamer',
        error: error.message
      });
    }
  }
}

module.exports = new StreamController();
