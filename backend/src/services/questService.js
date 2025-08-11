const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const UserProgression = require('../models/UserProgression');

class QuestService {
  
  // Obtenir les quêtes actives pour un utilisateur
  async getUserQuests(userId, type = null) {
    try {
      // Pour l'instant, retourner un tableau vide
      // À implémenter quand la base de données sera prête
      return [];
    } catch (error) {
      console.error('Erreur getUserQuests:', error);
      return [];
    }
  }

  // Mettre à jour la progression d'une quête
  async updateQuestProgress(userId, questType, actionData = {}) {
    try {
      // Pour l'instant, juste log l'action
      console.log(`🎯 Quest tracking: ${userId} - ${actionData.action}`, actionData);
      
      // Récupérer ou créer la progression utilisateur
      let userProgression = await UserProgression.findOne({
        where: { userId }
      });
      
      if (!userProgression) {
        userProgression = await UserProgression.create({ userId });
      }
      
      // Mettre à jour les compteurs selon l'action
      const updates = {};
      
      if (actionData.action === 'stream_discovered') {
        updates.streamsDiscovered = (userProgression.streamsDiscovered || 0) + 1;
      }
      
      if (actionData.action === 'favorite_added') {
        updates.favoritesAdded = (userProgression.favoritesAdded || 0) + 1;
      }
      
      if (Object.keys(updates).length > 0) {
        await userProgression.update(updates);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur updateQuestProgress:', error);
      return false;
    }
  }

  // Ajouter de l'XP (version simplifiée)
  async addXP(userId, xpAmount) {
    try {
      let userProgression = await UserProgression.findOne({
        where: { userId }
      });
      
      if (!userProgression) {
        userProgression = await UserProgression.create({ 
          userId, 
          totalXP: xpAmount,
          currentXP: xpAmount 
        });
      } else {
        const newTotalXP = (userProgression.totalXP || 0) + xpAmount;
        const newCurrentXP = (userProgression.currentXP || 0) + xpAmount;
        
        await userProgression.update({
          totalXP: newTotalXP,
          currentXP: newCurrentXP
        });
      }
      
      return userProgression;
    } catch (error) {
      console.error('Erreur addXP:', error);
      return null;
    }
  }

  // Obtenir la progression d'un utilisateur
  async getUserProgression(userId) {
    try {
      let userProgression = await UserProgression.findOne({
        where: { userId }
      });
      
      if (!userProgression) {
        userProgression = await UserProgression.create({ userId });
      }
      
      return userProgression.toJSON();
    } catch (error) {
      console.error('Erreur getUserProgression:', error);
      return {
        level: 1,
        totalXP: 0,
        currentXP: 0,
        nextLevelXP: 100,
        badges: [],
        titles: [],
        streamsDiscovered: 0,
        favoritesAdded: 0,
        questsCompleted: 0
      };
    }
  }
}

module.exports = new QuestService();
