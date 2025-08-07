/**
 * Script d'initialisation des quêtes par défaut
 * À exécuter une seule fois pour créer les quêtes de base
 */

const { sequelize } = require('./src/config/database');
const { Quest } = require('./src/models');

const defaultQuests = [
  // 🎯 QUÊTES QUOTIDIENNES
  {
    id: 'daily_discover_3',
    title: 'Explorateur du Jour',
    description: 'Découvre 3 nouveaux streams aujourd\'hui',
    type: 'daily',
    category: 'discovery',
    conditions: {
      action: 'stream_discovered',
      count: 3
    },
    rewards: {
      xp: 50,
      badges: ['daily_explorer']
    },
    isActive: true
  },
  {
    id: 'daily_add_favorite',
    title: 'Nouveau Coup de Cœur',
    description: 'Ajoute un streamer à tes favoris',
    type: 'daily',
    category: 'social',
    conditions: {
      action: 'favorite_added',
      count: 1
    },
    rewards: {
      xp: 30,
      badges: ['social_butterfly']
    },
    isActive: true
  },

  // 🎯 QUÊTES HEBDOMADAIRES
  {
    id: 'weekly_small_streamers',
    title: 'Défenseur des Petits',
    description: 'Découvre 10 streamers avec moins de 50 viewers cette semaine',
    type: 'weekly',
    category: 'discovery',
    conditions: {
      action: 'small_streamer_discovered',
      count: 10,
      maxViewers: 50
    },
    rewards: {
      xp: 200,
      badges: ['underdog_champion'],
      titles: ['Découvreur de Talents']
    },
    isActive: true
  },
  {
    id: 'weekly_variety_gamer',
    title: 'Touche-à-Tout',
    description: 'Découvre des streams de 5 jeux différents cette semaine',
    type: 'weekly',
    category: 'discovery',
    conditions: {
      action: 'stream_discovered',
      uniqueGames: 5
    },
    rewards: {
      xp: 150,
      badges: ['variety_seeker'],
      titles: ['Explorateur de Genres']
    },
    isActive: true
  },

  // 🎯 QUÊTES MENSUELLES
  {
    id: 'monthly_community_builder',
    title: 'Bâtisseur de Communauté',
    description: 'Aide 20 petits streamers en les ajoutant à tes favoris ce mois-ci',
    type: 'monthly',
    category: 'social',
    conditions: {
      action: 'favorite_added',
      count: 20,
      maxViewers: 100
    },
    rewards: {
      xp: 500,
      badges: ['community_builder'],
      titles: ['Ambassadeur des Petits Streamers']
    },
    isActive: true
  },

  // 🎯 QUÊTES DE RÉUSSITE (Achievement)
  {
    id: 'achievement_first_discovery',
    title: 'Premier Pas',
    description: 'Découvre ton premier stream sur Twitchscovery',
    type: 'achievement',
    category: 'milestone',
    conditions: {
      action: 'stream_discovered',
      count: 1
    },
    rewards: {
      xp: 100,
      badges: ['first_discovery'],
      titles: ['Néophyte Explorateur']
    },
    isActive: true
  },
  {
    id: 'achievement_discovery_master',
    title: 'Maître Découvreur',
    description: 'Découvre 100 streams au total',
    type: 'achievement',
    category: 'milestone',
    conditions: {
      action: 'stream_discovered',
      count: 100
    },
    rewards: {
      xp: 1000,
      badges: ['discovery_master'],
      titles: ['Maître Découvreur'],
      subscriptionBonus: 30
    },
    isActive: true
  },
  {
    id: 'achievement_social_butterfly',
    title: 'Papillon Social',
    description: 'Ajoute 50 streamers à tes favoris',
    type: 'achievement',
    category: 'social',
    conditions: {
      action: 'favorite_added',
      count: 50
    },
    rewards: {
      xp: 750,
      badges: ['social_master'],
      titles: ['Connecteur de Communautés']
    },
    isActive: true
  }
];

async function initializeQuests() {
  try {
    console.log('🎯 Initialisation des quêtes par défaut...');
    
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Synchroniser les modèles
    await sequelize.sync();
    console.log('✅ Modèles synchronisés');

    let created = 0;
    let existing = 0;

    for (const questData of defaultQuests) {
      const [quest, wasCreated] = await Quest.findOrCreate({
        where: { id: questData.id },
        defaults: questData
      });

      if (wasCreated) {
        console.log(`➕ Quête créée: ${quest.title}`);
        created++;
      } else {
        console.log(`ℹ️  Quête existe déjà: ${quest.title}`);
        existing++;
      }
    }

    console.log('\n🎉 Initialisation terminée !');
    console.log(`✅ ${created} nouvelles quêtes créées`);
    console.log(`ℹ️  ${existing} quêtes existantes ignorées`);
    console.log(`📊 Total: ${defaultQuests.length} quêtes dans le système`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  initializeQuests();
}

module.exports = { initializeQuests, defaultQuests };
