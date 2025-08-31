const twitchService = require('../services/twitchService');

class StreamController {
  // Découvrir un stream avec la logique intelligente
  async discoverStream(req, res) {
    try {
      const { userId } = req.user || {};
      const { 
        gameId, 
        game, // Support nom de jeu 
        language = 'fr', 
        minViewers = 10,
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
      
      res.json({
        success: true,
        data: stats,
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
}

module.exports = new StreamController();
