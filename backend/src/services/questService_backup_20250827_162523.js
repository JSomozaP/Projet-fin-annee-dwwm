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
    } catch (error)       console.error('❌ Erreur mise à jour compteurs conditionnels:', error);
      return false;
    }
  }
}

module.exports = new QuestService();console.error('Erreur getUserQuests:', error);
      return [];
    }
  }

  // Mettre à jour la progression d'une quête
  async updateQuestProgress(userId, questType, actionData = {}) {
    try {
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
        
        // Tracking conditionnel pour les quêtes spécifiques
        await this.trackConditionalQuests(userId, actionData);
      }
      
      if (actionData.action === 'favorite_added') {
        updates.favoritesAdded = (userProgression.favoritesAdded || 0) + 1;
        
        // Tracking conditionnel pour les favoris
        await this.trackConditionalQuests(userId, actionData);
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
    // Système de niveaux étendu - 200 niveaux (synchronisé avec le frontend)
  getLevelSystem() {
    const levels = [];
    
    // Niveaux 1-25 : définis explicitement
    const baseLevels = [
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
      { level: 25, requiredXP: 16200 }
    ];
    
    levels.push(...baseLevels);
    
    // Niveaux 26-50 : progression arithmétique
    for (let i = 26; i <= 50; i++) {
      const baseXP = 16200; // XP niveau 25
      const increment = 1850; // Augmentation par niveau
      const requiredXP = baseXP + (i - 25) * increment + Math.floor((i - 25) * 50); // Légère accélération
      levels.push({ level: i, requiredXP });
    }
    
    // Niveaux 51-100 : progression plus forte
    for (let i = 51; i <= 100; i++) {
      let requiredXP;
      if (i <= 55) requiredXP = 63700 + (i - 50) * 2650; // 51-55
      else if (i <= 60) requiredXP = 76950 + (i - 55) * 2900; // 56-60
      else if (i <= 70) requiredXP = 91450 + (i - 60) * 3275; // 61-70
      else if (i <= 80) requiredXP = 124200 + (i - 70) * 3775; // 71-80
      else if (i <= 90) requiredXP = 161950 + (i - 80) * 4275; // 81-90
      else requiredXP = 204700 + (i - 90) * 4775; // 91-100
      levels.push({ level: i, requiredXP });
    }
    
    // Niveaux 101-200 : progression exponentielle
    const megaLevels = [
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
    
    // Interpoler les niveaux manquants
    for (let i = 101; i <= 200; i++) {
      const existing = megaLevels.find(l => l.level === i);
      if (existing) {
        levels.push(existing);
      } else {
        // Interpolation entre les points de référence
        let requiredXP;
        if (i <= 105) requiredXP = 252450 + (i - 100) * 7910;
        else if (i <= 110) requiredXP = 292000 + (i - 105) * 11600;
        else if (i <= 120) requiredXP = 350000 + (i - 110) * 15000;
        else if (i <= 130) requiredXP = 500000 + (i - 120) * 22000;
        else if (i <= 140) requiredXP = 720000 + (i - 130) * 28000;
        else if (i <= 150) requiredXP = 1000000 + (i - 140) * 50000;
        else if (i <= 160) requiredXP = 1500000 + (i - 150) * 50000;
        else if (i <= 170) requiredXP = 2000000 + (i - 160) * 50000;
        else if (i <= 180) requiredXP = 2500000 + (i - 170) * 70000;
        else if (i <= 190) requiredXP = 3200000 + (i - 180) * 80000;
        else requiredXP = 4000000 + (i - 190) * 100000;
        
        levels.push({ level: i, requiredXP });
      }
    }
    
    return levels.sort((a, b) => a.level - b.level);
  }

  // Calculer le niveau basé sur l'XP total
  calculateLevel(totalXP) {
    const levels = this.getLevelSystem();
    
    let currentLevel = 1;
    let currentLevelXP = 0;
    
    // Trouver le niveau actuel
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalXP >= levels[i].requiredXP) {
        currentLevel = levels[i].level;
        currentLevelXP = levels[i].requiredXP;
        break;
      }
    }
    
    // Trouver le XP nécessaire pour le prochain niveau
    const nextLevel = levels.find(l => l.level === currentLevel + 1);
    const nextLevelXP = nextLevel ? nextLevel.requiredXP : currentLevelXP + 100000; // Fallback pour niveaux 201+
    
    return {
      level: currentLevel,
      currentXP: totalXP - currentLevelXP,
      nextLevelXP: nextLevelXP - currentLevelXP,
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

  // **NOUVELLE FONCTION: Tracking conditionnel des quêtes**
  async trackConditionalQuests(userId, actionData) {
    try {
      const { action, data } = actionData;
      
      if (action === 'stream_discovered') {
        const { viewerCount, isMicroStreamer, isSmallStreamer, gameCategory, streamerName } = data || {};
        
        console.log(`🔍 Tracking conditionnel - Stream découvert:`, {
          streamerName,
          viewerCount,
          isMicroStreamer,
          isSmallStreamer,
          gameCategory
        });
        
        // Mise à jour des compteurs conditionnels pour les quêtes
        await this.updateConditionalCounters(userId, {
          microStreamersDiscovered: isMicroStreamer ? 1 : 0,
          smallStreamersDiscovered: isSmallStreamer ? 1 : 0,
          ultraMicroStreamersDiscovered: viewerCount < 5 ? 1 : 0,
          categoriesDiscovered: gameCategory ? [gameCategory] : []
        });
      }
      
      if (action === 'favorite_added') {
        const { viewerCount, isMicroStreamer, isSmallStreamer, streamerName } = data || {};
        
        console.log(`❤️ Tracking conditionnel - Favori ajouté:`, {
          streamerName,
          viewerCount,
          isMicroStreamer,
          isSmallStreamer
        });
        
        // Mise à jour des compteurs conditionnels pour les favoris
        await this.updateConditionalCounters(userId, {
          microStreamersFavorited: isMicroStreamer ? 1 : 0,
          smallStreamersFavorited: isSmallStreamer ? 1 : 0,
          ultraMicroStreamersFavorited: viewerCount < 5 ? 1 : 0
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur tracking conditionnel:', error);
    }
  }

  // **NOUVELLE FONCTION: Mise à jour des compteurs conditionnels**
  async updateConditionalCounters(userId, counters) {
    try {
      // Pour l'instant, on va stocker ces compteurs dans un système simple
      // En production, on pourrait avoir une table séparée quest_progress
      console.log(`📊 Compteurs conditionnels pour ${userId}:`, counters);
      
      // TODO: Implémenter la persistance des compteurs conditionnels
      // Cela pourrait être dans une table quest_progress ou user_quest_data
      
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour compteurs conditionnels:', error);
      return false;
    }
  }
  }
}

module.exports = new QuestService();
