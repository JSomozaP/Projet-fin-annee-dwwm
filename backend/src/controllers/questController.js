const questService = require('../services/questService');

const questController = {
  
  // GET /api/quests - Obtenir toutes les quêtes de l'utilisateur
  async getUserQuests(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      const quests = await questService.getUserQuests(userId);
      
      res.json({
        success: true,
        data: {
          quests,
          summary: {
            daily: quests.filter(q => q.type === 'daily'),
            weekly: quests.filter(q => q.type === 'weekly'),
            achievements: quests.filter(q => q.type === 'achievement'),
            completed: quests.filter(q => q.isCompleted).length,
            total: quests.length
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération quêtes:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des quêtes'
      });
    }
  },

  // GET /api/quests/daily - Quêtes quotidiennes uniquement
  async getDailyQuests(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      const dailyQuests = await questService.getUserQuests(userId, 'daily');
      
      res.json({
        success: true,
        data: dailyQuests
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération quêtes quotidiennes:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des quêtes quotidiennes'
      });
    }
  },

  // POST /api/quests/track-action - Tracker une action pour les quêtes
  async trackAction(req, res) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { action, data } = req.body;
      
      if (!userId || !action) {
        return res.status(400).json({
          success: false,
          error: 'userId et action sont requis'
        });
      }

      console.log(`🎯 Action trackée: ${action} pour ${userId}`, data);

      // Mettre à jour la progression des quêtes
      await questService.updateQuestProgress(userId, 'all', {
        action,
        ...data
      });

      res.json({
        success: true,
        message: 'Action trackée avec succès'
      });
      
    } catch (error) {
      console.error('❌ Erreur tracking action:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du tracking de l\'action'
      });
    }
  },

  // GET /api/quests/progression - Progression globale de l'utilisateur
  async getUserProgression(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      const UserProgression = require('../models/UserProgression');
      let progression = await UserProgression.findOne({ where: { userId } });
      
      if (!progression) {
        progression = await UserProgression.create({ userId });
      }

      res.json({
        success: true,
        data: progression
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération progression:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la progression'
      });
    }
  },

  // POST /api/quests/complete/:questId - Compléter manuellement une quête (admin)
  async completeQuest(req, res) {
    try {
      const { questId } = req.params;
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      const Quest = require('../models/Quest');
      const quest = await Quest.findByPk(questId);
      
      if (!quest) {
        return res.status(404).json({
          success: false,
          error: 'Quête non trouvée'
        });
      }

      const result = await questService.completeQuest(userId, quest);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('❌ Erreur complétion quête:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la complétion de la quête'
      });
    }
  },

  // POST /api/quests/initialize - Initialiser les quêtes par défaut (admin)
  async initializeQuests(req, res) {
    try {
      await questService.initializeDefaultQuests();
      
      res.json({
        success: true,
        message: 'Quêtes par défaut initialisées'
      });
      
    } catch (error) {
      console.error('❌ Erreur initialisation quêtes:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'initialisation des quêtes'
      });
    }
  }
};

module.exports = questController;
