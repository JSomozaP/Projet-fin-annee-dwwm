const twitchService = require('../services/twitchService');

class StreamController {
  // Obtenir un stream aléatoire
  async getRandomStream(req, res) {
    try {
      const filters = {
        language: req.query.language || 'fr',
        minViewers: parseInt(req.query.minViewers) || undefined,
        maxViewers: parseInt(req.query.maxViewers) || undefined,
        game: req.query.game || undefined
      };

      const stream = await twitchService.getRandomStream(filters);

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Aucun stream trouvé avec ces critères'
        });
      }

      res.json({
        success: true,
        data: stream
      });
    } catch (error) {
      console.error('Erreur dans getRandomStream:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du stream'
      });
    }
  }

  // Obtenir tous les streams avec filtres
  async getStreams(req, res) {
    try {
      const filters = {
        limit: parseInt(req.query.limit) || 20,
        language: req.query.language || 'fr',
        game_id: req.query.game_id || undefined
      };

      const streams = await twitchService.getStreams(filters);

      res.json({
        success: true,
        data: streams,
        count: streams.length
      });
    } catch (error) {
      console.error('Erreur dans getStreams:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des streams'
      });
    }
  }

  // Rechercher un jeu par nom
  async searchGame(req, res) {
    try {
      const gameName = req.query.name;
      
      if (!gameName) {
        return res.status(400).json({
          success: false,
          message: 'Le nom du jeu est requis'
        });
      }

      const game = await twitchService.getGameByName(gameName);

      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Jeu non trouvé'
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
        message: 'Erreur serveur lors de la recherche du jeu'
      });
    }
  }
}

module.exports = new StreamController();
