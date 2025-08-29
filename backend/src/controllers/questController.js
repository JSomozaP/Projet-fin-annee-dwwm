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

      console.log(`🎯 Action trackée: ${action} pour ${userId}`);

      // Mettre à jour la progression des quêtes
      const result = await questService.updateQuestProgress(userId, 'all', {
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
      console.log('🎯 getUserProgression appelé');
      console.log('🔍 req.user:', req.user);
      console.log('🔍 req.query:', req.query);
      
      const userId = req.user?.id || req.query.userId;
      
      console.log('🆔 UserId extrait:', userId);
      
      if (!userId) {
        console.log('❌ Pas d\'userId trouvé');
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      const UserProgression = require('../models/UserProgression');
      let progression = await UserProgression.findOne({ where: { userId } });
      
      console.log('📊 Progression trouvée:', progression);
      
      if (!progression) {
        console.log('🔄 Création d\'une nouvelle progression pour userId:', userId);
        progression = await UserProgression.create({ 
          userId,
          level: 1,
          currentXP: 0,
          totalXP: 0,
          nextLevelXP: 1000,
          streamsDiscovered: 0,
          favoritesAdded: 0,
          badges: [],
          titles: ['Novice'],
          currentTitle: 'Novice'
        });
        console.log('✅ Nouvelle progression créée:', progression);
      }

      res.json({
        success: true,
        data: {
          id: progression.id,
          userId: progression.userId,
          level: progression.level || 1,
          currentXP: progression.currentXP || 0,
          totalXP: progression.totalXP || 0,
          nextLevelXP: progression.nextLevelXP || 1000,
          streamsDiscovered: progression.streamsDiscovered || 0,
          favoritesAdded: progression.favoritesAdded || 0,
          badges: progression.badges || [],
          titles: progression.titles || ['Novice'],
          currentTitle: progression.currentTitle || 'Novice'
        }
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
  },

  // POST /api/quests/recalculate-level - Recalculer le niveau basé sur l'XP
  async recalculateLevel(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      console.log(`🔄 Recalcul du niveau pour l'utilisateur: ${userId}`);
      
      const result = await questService.recalculateUserLevel(userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Niveau recalculé avec succès',
          data: result.progression
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Erreur lors du recalcul'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur recalcul niveau:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du recalcul du niveau'
      });
    }
  },

  // GET /api/quests/progress - Données de progression pour analytics
  async getQuestProgressData(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      console.log(`📊 Récupération des données de progression pour userId: ${userId}`);
      
      const progressData = await questService.getQuestProgressData(userId);
      
      res.json({
        success: true,
        data: progressData
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération données progression:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données de progression'
      });
    }
  },

  // GET /api/quests/progress-data - Données de progression des quêtes
  async getProgressData(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié'
        });
      }

      console.log(`📊 getProgressData appelé pour userId: ${userId}`);
      
      // Récupérer les données de progression depuis le service
      const progressData = await questService.getQuestProgressData(userId);
      
      res.json({
        success: true,
        data: progressData
      });
      
    } catch (error) {
      console.error('❌ Erreur getProgressData:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données de progression'
      });
    }
  }
};

module.exports = questController;
