const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Configuration de la base de données
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'motus123',
  database: 'streamyscovery'
};

// Définition des quêtes basées sur QUEST_SYSTEM_120.md
const quests = [
  // QUÊTES QUOTIDIENNES - Découverte (15 quêtes)
  { title: "Premier Contact", description: "Découvrez 1 nouveau streamer", type: "daily", category: "discovery", target_value: 1, xp_reward: 50 },
  { title: "Explorateur", description: "Découvrez 3 nouveaux streamers", type: "daily", category: "discovery", target_value: 3, xp_reward: 100 },
  { title: "Aventurier", description: "Découvrez 5 nouveaux streamers", type: "daily", category: "discovery", target_value: 5, xp_reward: 150 },
  { title: "Chasseur de Talents", description: "Découvrez 7 nouveaux streamers", type: "daily", category: "discovery", target_value: 7, xp_reward: 200 },
  { title: "Micro-Supporter", description: "Découvrez 3 streamers <50 viewers", type: "daily", category: "discovery", target_value: 3, xp_reward: 120 },
  { title: "Ami des Petits", description: "Découvrez 2 streamers <100 viewers", type: "daily", category: "discovery", target_value: 2, xp_reward: 100 },
  { title: "Sauveur Micro", description: "Découvrez 1 streamer <10 viewers", type: "daily", category: "discovery", target_value: 1, xp_reward: 80 },
  { title: "Découverte Express", description: "Découvrez 5 streamers en <30min", type: "daily", category: "discovery", target_value: 5, xp_reward: 160 },
  { title: "Chasseur Nocturne", description: "Découvrez 2 streamers après 22h", type: "daily", category: "discovery", target_value: 2, xp_reward: 110 },
  { title: "Lève-tôt", description: "Découvrez 1 streamer avant 8h", type: "daily", category: "discovery", target_value: 1, xp_reward: 90 },
  { title: "Explorateur Linguistique", description: "Découvrez des streamers parlant 2 langues différentes", type: "daily", category: "discovery", target_value: 2, xp_reward: 120 },
  { title: "Diversité Gaming", description: "Découvrez des streamers de 3 catégories différentes", type: "daily", category: "discovery", target_value: 3, xp_reward: 130 },
  { title: "Marathon Découverte", description: "Découvrez 10 streamers", type: "daily", category: "discovery", target_value: 10, xp_reward: 250 },
  { title: "Curiosité Insatiable", description: "Découvrez 15 streamers", type: "daily", category: "discovery", target_value: 15, xp_reward: 300 },
  { title: "Légende du Jour", description: "Découvrez 20 streamers", type: "daily", category: "discovery", target_value: 20, xp_reward: 400 },

  // QUÊTES QUOTIDIENNES - Social (12 quêtes)
  { title: "Nouveau Favori", description: "Ajoutez 1 streamer aux favoris", type: "daily", category: "social", target_value: 1, xp_reward: 50 },
  { title: "Collection Élargie", description: "Ajoutez 3 streamers aux favoris", type: "daily", category: "social", target_value: 3, xp_reward: 120 },
  { title: "Supporter Actif", description: "Ajoutez 5 streamers aux favoris", type: "daily", category: "social", target_value: 5, xp_reward: 180 },
  { title: "Fidélité", description: "Revisitez 2 streamers de vos favoris", type: "daily", category: "social", target_value: 2, xp_reward: 80 },
  { title: "Micro-Champion", description: "Ajoutez 2 micro-streamers (<50 viewers) aux favoris", type: "daily", category: "social", target_value: 2, xp_reward: 100 },
  { title: "Protecteur", description: "Ajoutez 1 streamer <10 viewers aux favoris", type: "daily", category: "social", target_value: 1, xp_reward: 70 },
  { title: "Favori Express", description: "Ajoutez 3 favoris en <15min", type: "daily", category: "social", target_value: 3, xp_reward: 140 },
  { title: "Supporter Diversité", description: "Ajoutez des favoris de 3 catégories différentes", type: "daily", category: "social", target_value: 3, xp_reward: 150 },
  { title: "Collection Linguistique", description: "Ajoutez des favoris parlant 2 langues", type: "daily", category: "social", target_value: 2, xp_reward: 110 },
  { title: "Fidélité Absolue", description: "Visitez 5 favoris existants", type: "daily", category: "social", target_value: 5, xp_reward: 120 },
  { title: "Curateur", description: "Organisez vos favoris par catégories", type: "daily", category: "social", target_value: 1, xp_reward: 80 },
  { title: "Social Butterfly", description: "Ajoutez 10 favoris", type: "daily", category: "social", target_value: 10, xp_reward: 250 },

  // QUÊTES QUOTIDIENNES - Temps de Visionnage (10 quêtes)
  { title: "Session Courte", description: "Regardez 15 minutes de contenu", type: "daily", category: "time", target_value: 15, xp_reward: 40 },
  { title: "Demi-heure", description: "Regardez 30 minutes de contenu", type: "daily", category: "time", target_value: 30, xp_reward: 60 },
  { title: "Heure Pleine", description: "Regardez 1 heure de contenu", type: "daily", category: "time", target_value: 60, xp_reward: 100 },
  { title: "Session Multiple", description: "Regardez 3 streamers différents", type: "daily", category: "time", target_value: 3, xp_reward: 90 },
  { title: "Marathon Mini", description: "Regardez 2 heures de contenu", type: "daily", category: "time", target_value: 120, xp_reward: 160 },
  { title: "Endurance", description: "Regardez 5 sessions de +10min chacune", type: "daily", category: "time", target_value: 5, xp_reward: 130 },
  { title: "Papillonnage", description: "Regardez 10 streamers différents <5min chacun", type: "daily", category: "time", target_value: 10, xp_reward: 120 },
  { title: "Session Dédiée", description: "Regardez 1 streamer pendant +45min", type: "daily", category: "time", target_value: 45, xp_reward: 110 },
  { title: "Exploration Temporelle", description: "Regardez du contenu sur 3 créneaux horaires différents", type: "daily", category: "time", target_value: 3, xp_reward: 140 },
  { title: "Nuit Blanche", description: "Regardez 30min après minuit", type: "daily", category: "time", target_value: 30, xp_reward: 100 },

  // QUÊTES HEBDOMADAIRES - Découverte Approfondie (12 quêtes)
  { title: "Explorateur Hebdomadaire", description: "Découvrez 20 nouveaux streamers", type: "weekly", category: "discovery", target_value: 20, xp_reward: 400 },
  { title: "Chasseur Intensif", description: "Découvrez 35 nouveaux streamers", type: "weekly", category: "discovery", target_value: 35, xp_reward: 600 },
  { title: "Légende Hebdomadaire", description: "Découvrez 50 nouveaux streamers", type: "weekly", category: "discovery", target_value: 50, xp_reward: 800 },
  { title: "Micro-Sauveur", description: "Découvrez 10 streamers <50 viewers", type: "weekly", category: "discovery", target_value: 10, xp_reward: 500 },
  { title: "Protecteur des Petits", description: "Découvrez 15 streamers <100 viewers", type: "weekly", category: "discovery", target_value: 15, xp_reward: 550 },
  { title: "Champion Micro", description: "Découvrez 5 streamers <10 viewers", type: "weekly", category: "discovery", target_value: 5, xp_reward: 400 },

  // QUÊTES MENSUELLES - Accomplissements Majeurs (8 quêtes)
  { title: "Explorateur du Mois", description: "100 nouveaux streamers", type: "monthly", category: "discovery", target_value: 100, xp_reward: 1500 },
  { title: "Légende Mensuelle", description: "200 nouveaux streamers", type: "monthly", category: "discovery", target_value: 200, xp_reward: 2500 },
  { title: "Micro-Héros", description: "50 micro-streamers découverts", type: "monthly", category: "discovery", target_value: 50, xp_reward: 2000 },
  { title: "Protecteur Ultime", description: "25 streamers <10 viewers découverts", type: "monthly", category: "discovery", target_value: 25, xp_reward: 1800 }
];

async function initializeQuests() {
  let connection;
  
  try {
    console.log('🔗 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧹 Nettoyage des quêtes existantes...');
    await connection.execute('DELETE FROM quests');
    
    console.log('🎯 Insertion des quêtes...');
    
    for (const quest of quests) {
      const questId = uuidv4();
      
      await connection.execute(
        `INSERT INTO quests (id, title, description, type, category, requirement, xpReward, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          questId,
          quest.title,
          quest.description,
          quest.type,
          quest.category,
          quest.target_value,
          quest.xp_reward,
          true
        ]
      );
      
      console.log(`✅ Quête ajoutée: ${quest.title} (${quest.type}) - ${quest.xp_reward} XP`);
    }
    
    console.log(`🎉 ${quests.length} quêtes initialisées avec succès !`);
    
    // Vérification
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM quests');
    console.log(`📊 Total en base de données: ${rows[0].count} quêtes`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des quêtes:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 Connexion fermée');
    }
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initializeQuests();
}

module.exports = { initializeQuests };
