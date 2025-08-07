const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const UserProgression = require('../models/UserProgression');

class QuestService {
  
  // Initialiser les quêtes par défaut
  async initializeDefaultQuests() {
    const defaultQuests = [
      // Quêtes quotidiennes
      {
        type: 'daily',
        title: '🔍 Explorateur du jour',
        description: 'Regarde 5 streamers avec moins de 10 viewers',
        xpReward: 100,
        requirement: 5,
        category: 'discovery',
        conditions: { maxViewers: 10 }
      },
      {
        type: 'daily',
        title: '💝 Supporter',
        description: 'Reste au moins 10 minutes sur un stream avec moins de 5 viewers',
        xpReward: 150,
        requirement: 10,
        category: 'engagement',
        conditions: { maxViewers: 5, minWatchTime: 10 }
      },
      {
        type: 'daily',
        title: '🎮 Découvreur de jeux',
        description: 'Découvre 3 streamers jouant à des jeux différents',
        xpReward: 120,
        requirement: 3,
        category: 'discovery'
      },
      
      // Quêtes hebdomadaires
      {
        type: 'weekly',
        title: '⭐ Parrain de la semaine',
        description: 'Ajoute 10 nouveaux streamers à tes favoris',
        xpReward: 500,
        requirement: 10,
        category: 'social'
      },
      {
        type: 'weekly',
        title: '🌍 Explorateur international',
        description: 'Regarde des streamers de 5 langues différentes',
        xpReward: 400,
        requirement: 5,
        category: 'discovery'
      },
      {
        type: 'weekly',
        title: '🚀 Lanceur de raids',
        description: 'Organise 3 raids inversés vers des petits streamers',
        xpReward: 600,
        requirement: 3,
        category: 'social'
      },
      
      // Achievements
      {
        type: 'achievement',
        title: '🏆 Découvreur d\'or',
        description: 'Découvre un streamer qui atteint 100+ viewers après ta visite',
        xpReward: 1000,
        requirement: 1,
        category: 'discovery',
        badgeReward: 'golden_discoverer'
      },
      {
        type: 'achievement',
        title: '👑 Roi de la découverte',
        description: 'Découvre 1000 streamers uniques',
        xpReward: 5000,
        requirement: 1000,
        category: 'discovery',
        badgeReward: 'discovery_king'
      }
    ];

    for (const questData of defaultQuests) {
      const existing = await Quest.findOne({
        where: { title: questData.title }
      });
      
      if (!existing) {
        await Quest.create(questData);
        console.log(`✅ Quête créée: ${questData.title}`);
      }
    }
  }

  // Obtenir les quêtes actives pour un utilisateur
  async getUserQuests(userId, type = null) {
    const whereClause = { isActive: true };
    if (type) whereClause.type = type;

    const quests = await Quest.findAll({ where: whereClause });
    
    const questsWithProgress = await Promise.all(
      quests.map(async (quest) => {
        let userQuest = await UserQuest.findOne({
          where: { userId, questId: quest.id }
        });

        // Créer la progression si elle n'existe pas
        if (!userQuest) {
          userQuest = await UserQuest.create({
            userId,
            questId: quest.id,
            progress: 0
          });
        }

        return {
          ...quest.toJSON(),
          progress: userQuest.progress,
          isCompleted: userQuest.isCompleted,
          completedAt: userQuest.completedAt
        };
      })
    );

    return questsWithProgress;
  }

  // Mettre à jour la progression d'une quête
  async updateQuestProgress(userId, questType, actionData = {}) {
    const quests = await this.getUserQuests(userId, questType === 'all' ? null : questType);
    
    for (const quest of quests) {
      if (quest.isCompleted) continue;

      const shouldProgress = this.checkQuestConditions(quest, actionData);
      
      if (shouldProgress) {
        const userQuest = await UserQuest.findOne({
          where: { userId, questId: quest.id }
        });

        let newProgress = userQuest.progress + 1;
        const isCompleted = newProgress >= quest.requirement;

        await userQuest.update({
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        });

        if (isCompleted) {
          await this.completeQuest(userId, quest);
          console.log(`🎉 Quête complétée: ${quest.title} par ${userId}`);
        }
      }
    }
  }

  // Vérifier si une action correspond aux conditions d'une quête
  checkQuestConditions(quest, actionData) {
    const conditions = quest.conditions || {};
    
    switch (quest.category) {
      case 'discovery':
        if (conditions.maxViewers && actionData.viewerCount > conditions.maxViewers) {
          return false;
        }
        if (conditions.minWatchTime && actionData.watchTime < conditions.minWatchTime) {
          return false;
        }
        return actionData.action === 'stream_discovered';
        
      case 'engagement':
        if (conditions.maxViewers && actionData.viewerCount > conditions.maxViewers) {
          return false;
        }
        return actionData.action === 'stream_watched' && 
               actionData.watchTime >= (conditions.minWatchTime || 0);
               
      case 'social':
        return actionData.action === 'favorite_added' || 
               actionData.action === 'raid_initiated' ||
               actionData.action === 'sponsorship_created';
               
      default:
        return false;
    }
  }

  // Compléter une quête et donner les récompenses
  async completeQuest(userId, quest) {
    // Donner l'XP
    await this.addXP(userId, quest.xpReward);
    
    // Donner le badge si applicable
    if (quest.badgeReward) {
      await this.unlockBadge(userId, quest.badgeReward);
    }
    
    return {
      questCompleted: quest.title,
      xpGained: quest.xpReward,
      badgeUnlocked: quest.badgeReward
    };
  }

  // Ajouter de l'XP et gérer les niveaux
  async addXP(userId, xpAmount) {
    let userProgression = await UserProgression.findOne({ where: { userId } });
    
    if (!userProgression) {
      userProgression = await UserProgression.create({ userId });
    }

    const newTotalXP = userProgression.totalXP + xpAmount;
    const newCurrentXP = userProgression.currentXP + xpAmount;
    
    // Calculer le nouveau niveau
    let newLevel = userProgression.level;
    let remainingXP = newCurrentXP;
    let nextLevelXP = userProgression.nextLevelXP;
    
    while (remainingXP >= nextLevelXP) {
      remainingXP -= nextLevelXP;
      newLevel++;
      nextLevelXP = this.calculateNextLevelXP(newLevel);
    }

    await userProgression.update({
      totalXP: newTotalXP,
      currentXP: remainingXP,
      level: newLevel,
      nextLevelXP: nextLevelXP
    });

    if (newLevel > userProgression.level) {
      console.log(`🎊 Level UP! ${userId} est maintenant niveau ${newLevel}`);
      // Déverrouiller des fonctionnalités selon le niveau
      await this.unlockLevelRewards(userId, newLevel);
    }

    return { newLevel, xpGained: xpAmount, leveledUp: newLevel > userProgression.level };
  }

  // Calculer l'XP nécessaire pour le prochain niveau
  calculateNextLevelXP(level) {
    return 1000 + (level - 1) * 500; // Progression exponentielle douce
  }

  // Débloquer un badge
  async unlockBadge(userId, badgeId) {
    const userProgression = await UserProgression.findOne({ where: { userId } });
    
    if (userProgression && !userProgression.badges.includes(badgeId)) {
      const newBadges = [...userProgression.badges, badgeId];
      await userProgression.update({ badges: newBadges });
      console.log(`🏅 Badge débloqué: ${badgeId} pour ${userId}`);
    }
  }

  // Déverrouiller des récompenses de niveau
  async unlockLevelRewards(userId, level) {
    const rewards = {
      5: { title: 'Explorateur', badge: 'explorer' },
      10: { title: 'Scout Expert', badge: 'expert_scout' },
      20: { title: 'Parrain', badge: 'sponsor' },
      50: { title: 'Légende', badge: 'legend' }
    };

    if (rewards[level]) {
      const reward = rewards[level];
      await this.unlockBadge(userId, reward.badge);
      
      const userProgression = await UserProgression.findOne({ where: { userId } });
      const newTitles = [...userProgression.titles, reward.title];
      await userProgression.update({ 
        titles: newTitles,
        currentTitle: reward.title // Auto-équiper le nouveau titre
      });
    }
  }

  // Reset des quêtes quotidiennes/hebdomadaires
  async resetQuests() {
    const now = new Date();
    
    // Reset quotidien à minuit
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      await UserQuest.destroy({
        where: {
          '$Quest.type$': 'daily'
        },
        include: [Quest]
      });
      console.log('🔄 Quêtes quotidiennes réinitialisées');
    }
    
    // Reset hebdomadaire le lundi
    if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
      await UserQuest.destroy({
        where: {
          '$Quest.type$': 'weekly'
        },
        include: [Quest]
      });
      console.log('🔄 Quêtes hebdomadaires réinitialisées');
    }
  }
}

module.exports = new QuestService();
