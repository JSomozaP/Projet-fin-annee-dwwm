/*
 * Streamyscovery - Service de gamification et quêtes
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Système de progression XP/Niveaux (200 niveaux)
 * Gestion des quêtes et récompenses
 */

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
      
      // **NOUVEAU: Gestion de la completion de quête**
      if (actionData.action === 'quest_completed') {
        console.log(`🎯 Completion de quête détectée:`, actionData);
        
        // Extraire les XP du champ reward (format "+100 XP") ou utiliser xpReward
        let xpReward = actionData.xpReward || 50;
        
        // Si pas d'xpReward mais un champ reward, l'extraire
        if (!actionData.xpReward && actionData.reward) {
          const match = actionData.reward.match(/\+(\d+)\s*XP/);
          xpReward = match ? parseInt(match[1]) : 50;
          console.log(`🔍 XP extraits du reward "${actionData.reward}": ${xpReward}`);
        }
        
        const newTotalXP = (userProgression.totalXP || 0) + xpReward;
        const newCurrentXP = (userProgression.currentXP || 0) + xpReward;
        
        updates.totalXP = newTotalXP;
        updates.currentXP = newCurrentXP;
        
        console.log(`💰 Ajout de ${xpReward} XP. Nouveau total: ${newTotalXP}`);
      }
      
      if (Object.keys(updates).length > 0) {
        console.log(`📊 Mise à jour progression:`, updates);
        await userProgression.update(updates);
        console.log(`✅ Progression mise à jour avec succès`);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur updateQuestProgress:', error);
      return false;
    }
  }

  // Ajouter de l'XP (version simplifiée)
  // Système de niveaux étendu - 200 niveaux (identique au frontend)
  getLevelSystem() {
    return [
      // Niveaux 1-10 : Débuts
      { level: 1, requiredXP: 0 },
      { level: 2, requiredXP: 100 },
      { level: 3, requiredXP: 250 },
      { level: 4, requiredXP: 450 },
      { level: 5, requiredXP: 700 },
      { level: 6, requiredXP: 1000 },
      { level: 7, requiredXP: 1350 },
      { level: 8, requiredXP: 1750 },
      { level: 9, requiredXP: 2200 },
      { level: 10, requiredXP: 2700 },
      
      // Niveaux 11-25 : Développement
      { level: 11, requiredXP: 3250 },
      { level: 12, requiredXP: 3850 },
      { level: 13, requiredXP: 4500 },
      { level: 14, requiredXP: 5200 },
      { level: 15, requiredXP: 5950 },
      { level: 16, requiredXP: 6750 },
      { level: 17, requiredXP: 7600 },
      { level: 18, requiredXP: 8500 },
      { level: 19, requiredXP: 9450 },
      { level: 20, requiredXP: 10450 },
      { level: 21, requiredXP: 11500 },
      { level: 22, requiredXP: 12600 },
      { level: 23, requiredXP: 13750 },
      { level: 24, requiredXP: 14950 },
      { level: 25, requiredXP: 16200 },
      
      // Niveaux 26-50 : Excellence
      { level: 26, requiredXP: 17500 },
      { level: 27, requiredXP: 18850 },
      { level: 28, requiredXP: 20250 },
      { level: 29, requiredXP: 21700 },
      { level: 30, requiredXP: 23200 },
      { level: 31, requiredXP: 24750 },
      { level: 32, requiredXP: 26350 },
      { level: 33, requiredXP: 28000 },
      { level: 34, requiredXP: 29700 },
      { level: 35, requiredXP: 31450 },
      { level: 36, requiredXP: 33250 },
      { level: 37, requiredXP: 35100 },
      { level: 38, requiredXP: 37000 },
      { level: 39, requiredXP: 38950 },
      { level: 40, requiredXP: 40950 },
      { level: 41, requiredXP: 43000 },
      { level: 42, requiredXP: 45100 },
      { level: 43, requiredXP: 47250 },
      { level: 44, requiredXP: 49450 },
      { level: 45, requiredXP: 51700 },
      { level: 46, requiredXP: 54000 },
      { level: 47, requiredXP: 56350 },
      { level: 48, requiredXP: 58750 },
      { level: 49, requiredXP: 61200 },
      { level: 50, requiredXP: 63700 },
      
      // Niveaux 51-100 : Phase Légendaire
      { level: 55, requiredXP: 76950 },
      { level: 60, requiredXP: 91450 },
      { level: 65, requiredXP: 107200 },
      { level: 70, requiredXP: 124200 },
      { level: 75, requiredXP: 142450 },
      { level: 80, requiredXP: 161950 },
      { level: 85, requiredXP: 182700 },
      { level: 90, requiredXP: 204700 },
      { level: 95, requiredXP: 227950 },
      { level: 100, requiredXP: 252450 },
      
      // Niveaux 101-200 : Au-delà de la Transcendance
      { level: 105, requiredXP: 292000 },
      { level: 110, requiredXP: 350000 },
      { level: 120, requiredXP: 500000 },
      { level: 130, requiredXP: 720000 },
      { level: 140, requiredXP: 1000000 },
      { level: 150, requiredXP: 1500000 },
      { level: 160, requiredXP: 2000000 },
      { level: 170, requiredXP: 2500000 },
      { level: 180, requiredXP: 3200000 },
      { level: 190, requiredXP: 4000000 },
      { level: 200, requiredXP: 5000000 }
    ];
  }

  // Calculer le niveau basé sur l'XP total
  calculateLevel(totalXP) {
    const levelSystem = this.getLevelSystem();
    let currentLevel = 1;
    let currentLevelXP = 0;
    let nextLevelXP = 100;

    // Trouver le niveau actuel
    for (let i = levelSystem.length - 1; i >= 0; i--) {
      if (totalXP >= levelSystem[i].requiredXP) {
        currentLevel = levelSystem[i].level;
        currentLevelXP = levelSystem[i].requiredXP;
        
        // Trouver le XP pour le prochain niveau
        const nextLevel = levelSystem.find(l => l.level === currentLevel + 1);
        nextLevelXP = nextLevel ? nextLevel.requiredXP : currentLevelXP + 1000;
        break;
      }
    }

    return {
      level: currentLevel,
      currentXP: totalXP - currentLevelXP, // XP dans le niveau actuel
      nextLevelXP: nextLevelXP - currentLevelXP, // XP nécessaire pour le prochain niveau
      totalXP: totalXP
    };
  }

  async addXP(userId, xpAmount) {
    try {
      const userProgression = await UserProgression.findByUserId(userId);
      if (!userProgression) {
        return null;
      }

      const newTotalXP = userProgression.totalXP + xpAmount;
      
      // Calculer automatiquement le nouveau niveau
      const levelInfo = this.calculateLevel(newTotalXP);
      
      console.log(`💰 Ajout de ${xpAmount} XP. Nouveau total: ${newTotalXP}`);
      console.log(`📊 Niveau calculé: ${levelInfo.level}, XP dans niveau: ${levelInfo.currentXP}/${levelInfo.nextLevelXP}`);
      
      // Mise à jour en base de données avec le nouveau niveau
      const updatedProgression = await UserProgression.update(userProgression.id, {
        level: levelInfo.level,
        totalXP: levelInfo.totalXP,
        currentXP: levelInfo.currentXP,
        nextLevelXP: levelInfo.nextLevelXP
      });
      
      if (updatedProgression) {
        console.log(`📊 Mise à jour progression: { level: ${levelInfo.level}, totalXP: ${levelInfo.totalXP}, currentXP: ${levelInfo.currentXP}, nextLevelXP: ${levelInfo.nextLevelXP} }`);
        
        // Retourner l'objet avec les nouvelles valeurs
        return Object.assign(userProgression, levelInfo);
      }
      
      return userProgression;
    } catch (error) {
      console.error('Erreur addXP:', error);
      return null;
    }
  }

  // Recalculer le niveau d'un utilisateur basé sur son XP actuel
  async recalculateUserLevel(userId) {
    try {
      const userProgression = await UserProgression.findByUserId(userId);
      if (!userProgression) {
        return {
          success: false,
          error: 'Progression utilisateur introuvable'
        };
      }

      console.log(`📊 XP actuel: ${userProgression.totalXP}, Niveau actuel: ${userProgression.level}`);
      
      // Calculer le niveau correct basé sur l'XP total
      const levelInfo = this.calculateLevel(userProgression.totalXP);
      
      console.log(`🔄 Nouveau niveau calculé: ${levelInfo.level}, XP dans niveau: ${levelInfo.currentXP}/${levelInfo.nextLevelXP}`);
      
      // Mettre à jour en base
      const updatedProgression = await UserProgression.update(userProgression.id, {
        level: levelInfo.level,
        currentXP: levelInfo.currentXP,
        nextLevelXP: levelInfo.nextLevelXP
      });
      
      if (updatedProgression) {
        console.log(`✅ Niveau mis à jour: ${userProgression.level} → ${levelInfo.level}`);
        return {
          success: true,
          progression: Object.assign(userProgression, levelInfo)
        };
      }
      
      return {
        success: false,
        error: 'Erreur lors de la mise à jour'
      };
      
    } catch (error) {
      console.error('Erreur recalculateUserLevel:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Compléter une quête et ajouter les XP
  async completeQuest(userId, quest) {
    try {
      console.log(`🎯 Complétion de quête pour userId: ${userId}`, quest);
      
      // Calculer les XP à ajouter (basé sur la rareté de la quête)
      let xpReward = 50; // XP de base
      
      if (quest && quest.type) {
        switch (quest.type) {
          case 'daily':
            xpReward = 50;
            break;
          case 'weekly':
            xpReward = 200;
            break;
          case 'monthly':
            xpReward = 500;
            break;
          case 'achievement':
            xpReward = 100;
            break;
          default:
            xpReward = 50;
        }
      }
      
      console.log(`💰 Ajout de ${xpReward} XP pour la quête`);
      
      // Ajouter les XP
      const progression = await this.addXP(userId, xpReward);
      
      if (progression) {
        console.log(`✅ Quête complétée ! Total XP: ${progression.totalXP}`);
        return {
          success: true,
          xpGained: xpReward,
          totalXP: progression.totalXP,
          currentXP: progression.currentXP,
          level: progression.level
        };
      }
      
      return { success: false, error: 'Impossible de mettre à jour la progression' };
    } catch (error) {
      console.error('❌ Erreur completeQuest:', error);
      return { success: false, error: error.message };
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

  // Obtenir les données de progression pour les analytics
  async getQuestProgressData(userId) {
    try {
      console.log(`📊 Récupération des données de progression pour userId: ${userId}`);
      
      let userProgression = await UserProgression.findOne({
        where: { userId }
      });
      
      if (!userProgression) {
        console.log(`🆕 Création nouvelle progression pour userId: ${userId}`);
        userProgression = await UserProgression.create({ userId });
      }
      
      // Calculer les informations de niveau basées sur l'XP total
      const levelInfo = this.calculateLevel(userProgression.totalXP || 0);
      
      const progressData = {
        // Progression générale
        level: levelInfo.level,
        totalXP: levelInfo.totalXP,
        currentXP: levelInfo.currentXP,
        nextLevelXP: levelInfo.nextLevelXP,
        
        // Statistiques de découverte
        streamsDiscovered: userProgression.streamsDiscovered || 0,
        favoritesAdded: userProgression.favoritesAdded || 0,
        questsCompleted: userProgression.questsCompleted || 0,
        
        // Données pour analytics
        weeklyXpGain: userProgression.weeklyXpGain || 0,
        weeklyDiscovered: userProgression.weeklyDiscovered || 0,
        weeklyFavorites: userProgression.weeklyFavorites || 0,
        
        // Badges et titres
        badges: userProgression.badges || [],
        titles: userProgression.titles || [],
        
        // Progression en pourcentage dans le niveau actuel
        progressPercentage: levelInfo.nextLevelXP > 0 ? 
          Math.round((levelInfo.currentXP / levelInfo.nextLevelXP) * 100) : 100
      };
      
      console.log(`✅ Données de progression récupérées:`, {
        level: progressData.level,
        totalXP: progressData.totalXP,
        streamsDiscovered: progressData.streamsDiscovered,
        favoritesAdded: progressData.favoritesAdded
      });
      
      return progressData;
    } catch (error) {
      console.error('❌ Erreur getQuestProgressData:', error);
      return {
        level: 1,
        totalXP: 0,
        currentXP: 0,
        nextLevelXP: 100,
        streamsDiscovered: 0,
        favoritesAdded: 0,
        questsCompleted: 0,
        weeklyXpGain: 0,
        weeklyDiscovered: 0,
        weeklyFavorites: 0,
        badges: [],
        titles: [],
        progressPercentage: 0
      };
    }
  }
}

module.exports = new QuestService();
