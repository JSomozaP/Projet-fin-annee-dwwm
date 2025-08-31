const { pool } = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

// Système complet de 120 quêtes basé sur QUEST_SYSTEM_120.md
const allQuests = [
  // === QUÊTES QUOTIDIENNES (50 quêtes) ===
  
  // Découverte (15 quêtes)
  { title: "Premier Contact", description: "Découvrez 1 nouveau streamer", type: "daily", category: "discovery", requirement: 1, xpReward: 100 },
  { title: "Explorateur", description: "Découvrez 3 nouveaux streamers", type: "daily", category: "discovery", requirement: 3, xpReward: 100 },
  { title: "Aventurier", description: "Découvrez 5 nouveaux streamers", type: "daily", category: "discovery", requirement: 5, xpReward: 120 },
  { title: "Chasseur de Talents", description: "Découvrez 7 nouveaux streamers", type: "daily", category: "discovery", requirement: 7, xpReward: 140 },
  { title: "Micro-Supporter", description: "Découvrez 3 streamers <50 viewers", type: "daily", category: "discovery", requirement: 3, xpReward: 130 },
  { title: "Ami des Petits", description: "Découvrez 2 streamers <100 viewers", type: "daily", category: "discovery", requirement: 2, xpReward: 110 },
  { title: "Sauveur Micro", description: "Découvrez 1 streamer <10 viewers", type: "daily", category: "discovery", requirement: 1, xpReward: 120 },
  { title: "Découverte Express", description: "Découvrez 5 streamers en <30min", type: "daily", category: "discovery", requirement: 5, xpReward: 150 },
  { title: "Chasseur Nocturne", description: "Découvrez 2 streamers après 22h", type: "daily", category: "discovery", requirement: 2, xpReward: 110 },
  { title: "Lève-tôt", description: "Découvrez 1 streamer avant 8h", type: "daily", category: "discovery", requirement: 1, xpReward: 100 },
  { title: "Explorateur Linguistique", description: "Découvrez des streamers parlant 2 langues différentes", type: "daily", category: "discovery", requirement: 2, xpReward: 120 },
  { title: "Diversité Gaming", description: "Découvrez des streamers de 3 catégories différentes", type: "daily", category: "discovery", requirement: 3, xpReward: 130 },
  { title: "Marathon Découverte", description: "Découvrez 10 streamers", type: "daily", category: "discovery", requirement: 10, xpReward: 180 },
  { title: "Curiosité Insatiable", description: "Découvrez 15 streamers", type: "daily", category: "discovery", requirement: 15, xpReward: 220 },
  { title: "Légende du Jour", description: "Découvrez 20 streamers", type: "daily", category: "discovery", requirement: 20, xpReward: 300 },

  // Social (12 quêtes)
  { title: "Nouveau Favori", description: "Ajoutez 1 streamer aux favoris", type: "daily", category: "social", requirement: 1, xpReward: 50 },
  { title: "Collection Élargie", description: "Ajoutez 3 streamers aux favoris", type: "daily", category: "social", requirement: 3, xpReward: 120 },
  { title: "Supporter Actif", description: "Ajoutez 5 streamers aux favoris", type: "daily", category: "social", requirement: 5, xpReward: 180 },
  { title: "Fidélité", description: "Revisitez 2 streamers de vos favoris", type: "daily", category: "social", requirement: 2, xpReward: 80 },
  { title: "Micro-Champion", description: "Ajoutez 2 micro-streamers (<50 viewers) aux favoris", type: "daily", category: "social", requirement: 2, xpReward: 100 },
  { title: "Protecteur", description: "Ajoutez 1 streamer <10 viewers aux favoris", type: "daily", category: "social", requirement: 1, xpReward: 80 },
  { title: "Favori Express", description: "Ajoutez 3 favoris en <15min", type: "daily", category: "social", requirement: 3, xpReward: 130 },
  { title: "Supporter Diversité", description: "Ajoutez des favoris de 3 catégories différentes", type: "daily", category: "social", requirement: 3, xpReward: 120 },
  { title: "Curateur", description: "Organisez vos favoris par catégories", type: "daily", category: "social", requirement: 1, xpReward: 70 },
  { title: "Collection Globale", description: "Ajoutez des favoris de 2 pays différents", type: "daily", category: "social", requirement: 2, xpReward: 100 },
  { title: "Speed Supporter", description: "Ajoutez 5 favoris en <10min", type: "daily", category: "social", requirement: 5, xpReward: 150 },
  { title: "Découvreur Social", description: "Ajoutez 7 nouveaux favoris", type: "daily", category: "social", requirement: 7, xpReward: 200 },

  // Temps de Visionnage (10 quêtes)
  { title: "Session Courte", description: "Regardez 15 minutes de contenu", type: "daily", category: "time", requirement: 15, xpReward: 40 },
  { title: "Demi-heure", description: "Regardez 30 minutes de contenu", type: "daily", category: "time", requirement: 30, xpReward: 75 },
  { title: "Heure Pleine", description: "Regardez 1 heure de contenu", type: "daily", category: "time", requirement: 60, xpReward: 120 },
  { title: "Session Multiple", description: "Regardez 3 streamers différents", type: "daily", category: "time", requirement: 3, xpReward: 90 },
  { title: "Marathon Mini", description: "Regardez 2 heures de contenu", type: "daily", category: "time", requirement: 120, xpReward: 180 },
  { title: "Endurance", description: "Regardez 5 sessions de +10min chacune", type: "daily", category: "time", requirement: 5, xpReward: 150 },
  { title: "Papillonnage", description: "Regardez 10 streamers différents <5min chacun", type: "daily", category: "time", requirement: 10, xpReward: 130 },
  { title: "Session Dédiée", description: "Regardez 1 streamer pendant +45min", type: "daily", category: "time", requirement: 45, xpReward: 110 },
  { title: "Exploration Temporelle", description: "Regardez du contenu sur 3 créneaux horaires différents", type: "daily", category: "time", requirement: 3, xpReward: 120 },
  { title: "Noctambule", description: "Regardez 30min après 23h", type: "daily", category: "time", requirement: 30, xpReward: 100 },

  // Variété et Exploration (8 quêtes)
  { title: "Touche-à-tout", description: "Explorez 3 catégories de jeux différentes", type: "daily", category: "variety", requirement: 3, xpReward: 110 },
  { title: "Genre Master", description: "Passez 1h sur une seule catégorie", type: "daily", category: "variety", requirement: 1, xpReward: 100 },
  { title: "Découvreur de Genres", description: "Explorez 5 catégories différentes", type: "daily", category: "variety", requirement: 5, xpReward: 150 },
  { title: "Explorateur Linguistique Multi", description: "Regardez des streams en 2 langues", type: "daily", category: "variety", requirement: 2, xpReward: 120 },
  { title: "Tour du Monde", description: "Regardez des streamers de 3 pays différents", type: "daily", category: "variety", requirement: 3, xpReward: 140 },
  { title: "Rétro Gaming", description: "Regardez 30min de jeux rétro", type: "daily", category: "variety", requirement: 30, xpReward: 90 },
  { title: "Tendance Actuelle", description: "Regardez 30min du jeu #1 trending", type: "daily", category: "variety", requirement: 30, xpReward: 100 },
  { title: "Niche Explorer", description: "Regardez 20min d'une catégorie <1000 viewers total", type: "daily", category: "variety", requirement: 20, xpReward: 110 },

  // Progression et Achievements (5 quêtes)
  { title: "XP Hunter", description: "Gagnez 200 XP aujourd'hui", type: "daily", category: "progression", requirement: 200, xpReward: 100 },
  { title: "Quest Master", description: "Complétez 3 quêtes aujourd'hui", type: "daily", category: "progression", requirement: 3, xpReward: 150 },
  { title: "Perfectionniste", description: "Complétez toutes les quêtes quotidiennes", type: "daily", category: "progression", requirement: 1, xpReward: 300 },
  { title: "Speed Runner", description: "Complétez 5 quêtes en <2h", type: "daily", category: "progression", requirement: 5, xpReward: 250 },
  { title: "Consistency", description: "Complétez au moins 1 quête", type: "daily", category: "progression", requirement: 1, xpReward: 50 },

  // === QUÊTES HEBDOMADAIRES (40 quêtes) ===
  
  // Découverte Approfondie (12 quêtes)
  { title: "Explorateur Hebdomadaire", description: "Découvrez 20 nouveaux streamers", type: "weekly", category: "discovery", requirement: 20, xpReward: 500 },
  { title: "Chasseur Intensif", description: "Découvrez 35 nouveaux streamers", type: "weekly", category: "discovery", requirement: 35, xpReward: 700 },
  { title: "Légende Hebdomadaire", description: "Découvrez 50 nouveaux streamers", type: "weekly", category: "discovery", requirement: 50, xpReward: 1000 },
  { title: "Micro-Sauveur", description: "Découvrez 10 streamers <50 viewers", type: "weekly", category: "discovery", requirement: 10, xpReward: 600 },
  { title: "Protecteur des Petits", description: "Découvrez 15 streamers <100 viewers", type: "weekly", category: "discovery", requirement: 15, xpReward: 700 },
  { title: "Champion Micro", description: "Découvrez 5 streamers <10 viewers", type: "weekly", category: "discovery", requirement: 5, xpReward: 500 },
  { title: "Explorateur Nocturne", description: "Découvrez 8 streamers après 22h", type: "weekly", category: "discovery", requirement: 8, xpReward: 400 },
  { title: "Matinal Actif", description: "Découvrez 5 streamers avant 9h", type: "weekly", category: "discovery", requirement: 5, xpReward: 350 },
  { title: "Weekend Warrior", description: "Découvrez 25 streamers le weekend", type: "weekly", category: "discovery", requirement: 25, xpReward: 600 },
  { title: "Diversité Linguistique", description: "Découvrez des streamers de 4 langues", type: "weekly", category: "discovery", requirement: 4, xpReward: 400 },
  { title: "Tour Continental", description: "Découvrez des streamers de 6 pays", type: "weekly", category: "discovery", requirement: 6, xpReward: 500 },
  { title: "Chasseur d'Élite", description: "Découvrez 100 streamers", type: "weekly", category: "discovery", requirement: 100, xpReward: 1500 },

  // Social Étendu (10 quêtes)
  { title: "Collectionneur", description: "Ajoutez 10 favoris", type: "weekly", category: "social", requirement: 10, xpReward: 400 },
  { title: "Supporter Premium", description: "Ajoutez 15 favoris", type: "weekly", category: "social", requirement: 15, xpReward: 500 },
  { title: "Parrain Communautaire", description: "Ajoutez 20 favoris", type: "weekly", category: "social", requirement: 20, xpReward: 600 },
  { title: "Micro-Supporter Weekly", description: "Ajoutez 8 micro-streamers aux favoris", type: "weekly", category: "social", requirement: 8, xpReward: 450 },
  { title: "Protecteur Actif", description: "Ajoutez 5 streamers <10 viewers aux favoris", type: "weekly", category: "social", requirement: 5, xpReward: 400 },
  { title: "Fidélité Intense", description: "Visitez 10 favoris existants", type: "weekly", category: "social", requirement: 10, xpReward: 350 },
  { title: "Curateur Expert", description: "Organisez 20 favoris par catégories", type: "weekly", category: "social", requirement: 20, xpReward: 300 },
  { title: "Supporter Diversité Weekly", description: "Ajoutez des favoris de 6 catégories", type: "weekly", category: "social", requirement: 6, xpReward: 400 },
  { title: "Collection Globale Weekly", description: "Ajoutez des favoris de 4 pays", type: "weekly", category: "social", requirement: 4, xpReward: 350 },
  { title: "Légende Sociale", description: "Ajoutez 50 favoris", type: "weekly", category: "social", requirement: 50, xpReward: 1000 },

  // Sessions Marathon (8 quêtes)
  { title: "Marathon Light", description: "Regardez 5 heures de contenu", type: "weekly", category: "time", requirement: 300, xpReward: 400 },
  { title: "Marathon Standard", description: "Regardez 10 heures de contenu", type: "weekly", category: "time", requirement: 600, xpReward: 700 },
  { title: "Marathon Intense", description: "Regardez 15 heures de contenu", type: "weekly", category: "time", requirement: 900, xpReward: 1000 },
  { title: "Session Longue", description: "Une session de +2h continue", type: "weekly", category: "time", requirement: 120, xpReward: 300 },
  { title: "Endurance Weekend", description: "8h de contenu sur le weekend", type: "weekly", category: "time", requirement: 480, xpReward: 600 },
  { title: "Régularité", description: "Au moins 1h/jour pendant 5 jours", type: "weekly", category: "time", requirement: 5, xpReward: 500 },
  { title: "Exploration Intensive", description: "20 streamers différents dans la semaine", type: "weekly", category: "time", requirement: 20, xpReward: 400 },
  { title: "Fidélité Hebdomadaire", description: "Visitez 5 favoris chaque jour", type: "weekly", category: "time", requirement: 5, xpReward: 450 },

  // Maîtrise de Genres (6 quêtes)
  { title: "Spécialiste", description: "5h sur une seule catégorie", type: "weekly", category: "variety", requirement: 300, xpReward: 400 },
  { title: "Diversité Expert", description: "8 catégories différentes explorées", type: "weekly", category: "variety", requirement: 8, xpReward: 500 },
  { title: "Genre Master Weekly", description: "3h chacune sur 3 catégories", type: "weekly", category: "variety", requirement: 3, xpReward: 450 },
  { title: "Explorateur Global", description: "Contenu de 8 pays différents", type: "weekly", category: "variety", requirement: 8, xpReward: 500 },
  { title: "Polyglotte", description: "Streams en 5 langues différentes", type: "weekly", category: "variety", requirement: 5, xpReward: 450 },
  { title: "Niche Master", description: "2h sur des catégories <500 viewers", type: "weekly", category: "variety", requirement: 120, xpReward: 400 },

  // Défis Avancés (4 quêtes)
  { title: "Week Perfectionniste", description: "Complétez toutes les quotidiennes 5 jours", type: "weekly", category: "progression", requirement: 5, xpReward: 800 },
  { title: "Speed Master", description: "20 quêtes en 2 jours", type: "weekly", category: "progression", requirement: 20, xpReward: 700 },
  { title: "Consistency King", description: "7 jours consécutifs avec quêtes complétées", type: "weekly", category: "progression", requirement: 7, xpReward: 900 },
  { title: "Hebdo Légende", description: "Complétez toutes les hebdomadaires", type: "weekly", category: "progression", requirement: 1, xpReward: 1200 },

  // === QUÊTES MENSUELLES (20 quêtes) ===
  
  // Accomplissements Majeurs (8 quêtes)
  { title: "Explorateur du Mois", description: "100 nouveaux streamers", type: "monthly", category: "discovery", requirement: 100, xpReward: 1500 },
  { title: "Légende Mensuelle", description: "200 nouveaux streamers", type: "monthly", category: "discovery", requirement: 200, xpReward: 2500 },
  { title: "Dieu de la Découverte", description: "500 nouveaux streamers", type: "monthly", category: "discovery", requirement: 500, xpReward: 5000 },
  { title: "Micro-Héros", description: "50 micro-streamers découverts", type: "monthly", category: "discovery", requirement: 50, xpReward: 2000 },
  { title: "Protecteur Ultime", description: "25 streamers <10 viewers découverts", type: "monthly", category: "discovery", requirement: 25, xpReward: 1800 },
  { title: "Champion Global", description: "Streamers de 15 pays", type: "monthly", category: "discovery", requirement: 15, xpReward: 1600 },
  { title: "Maître Linguistique", description: "Streams en 8 langues", type: "monthly", category: "discovery", requirement: 8, xpReward: 1400 },
  { title: "Univers Explorer", description: "1000 streamers découverts", type: "monthly", category: "discovery", requirement: 1000, xpReward: 8000 },

  // Social Ultime (4 quêtes)
  { title: "Collectionneur Ultime", description: "50 favoris ajoutés", type: "monthly", category: "social", requirement: 50, xpReward: 1500 },
  { title: "Parrain Légendaire", description: "100 favoris ajoutés", type: "monthly", category: "social", requirement: 100, xpReward: 2500 },
  { title: "Micro-Champion Monthly", description: "30 micro-streamers en favoris", type: "monthly", category: "social", requirement: 30, xpReward: 2000 },
  { title: "Collection Mondiale", description: "Favoris de 10 pays", type: "monthly", category: "social", requirement: 10, xpReward: 1600 },

  // Temps Massif (4 quêtes)
  { title: "Marathon du Mois", description: "50h de contenu", type: "monthly", category: "time", requirement: 3000, xpReward: 2000 },
  { title: "Légende Temporelle", description: "100h de contenu", type: "monthly", category: "time", requirement: 6000, xpReward: 3500 },
  { title: "Consistency Master", description: "Au moins 2h/jour pendant 20 jours", type: "monthly", category: "time", requirement: 20, xpReward: 2200 },
  { title: "Endurance Ultime", description: "200h de contenu", type: "monthly", category: "time", requirement: 12000, xpReward: 6000 },

  // Maîtrise Absolue (3 quêtes)
  { title: "Maître de Tous", description: "20 catégories explorées", type: "monthly", category: "variety", requirement: 20, xpReward: 2000 },
  { title: "Expert Universel", description: "5h chacune sur 10 catégories", type: "monthly", category: "variety", requirement: 10, xpReward: 2500 },
  { title: "Conquérant des Genres", description: "50 catégories différentes", type: "monthly", category: "variety", requirement: 50, xpReward: 4000 },

  // Achievements Légendaires (1 quête)
  { title: "Perfectionniste Absolu", description: "Complétez toutes les quêtes mensuelles", type: "monthly", category: "progression", requirement: 1, xpReward: 10000 },

  // === QUÊTES SAISONNIÈRES (10 quêtes) ===
  { title: "Festival de Printemps", description: "Événement saisonnier", type: "achievement", category: "event", requirement: 1, xpReward: 1000 },
  { title: "Marathon d'Été", description: "Défi estival", type: "achievement", category: "event", requirement: 1, xpReward: 1500 },
  { title: "Récolte d'Automne", description: "Quête automnale", type: "achievement", category: "event", requirement: 1, xpReward: 1200 },
  { title: "Magie d'Hiver", description: "Défi hivernal", type: "achievement", category: "event", requirement: 1, xpReward: 1300 },
  { title: "Anniversaire Streamyscovery", description: "Célébration annuelle", type: "achievement", category: "event", requirement: 1, xpReward: 2000 },
  { title: "Black Friday Gaming", description: "Événement commercial", type: "achievement", category: "event", requirement: 1, xpReward: 800 },
  { title: "Nouvel An Gaming", description: "Célébration nouvelle année", type: "achievement", category: "event", requirement: 1, xpReward: 1500 },
  { title: "Saint-Valentin Streaming", description: "Événement romantique", type: "achievement", category: "event", requirement: 1, xpReward: 700 },
  { title: "Pâques Discovery", description: "Chasse aux streamers", type: "achievement", category: "event", requirement: 1, xpReward: 900 },
  { title: "Halloween Horror", description: "Défi d'horreur", type: "achievement", category: "event", requirement: 1, xpReward: 1100 }
];

async function initializeQuests() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🎯 Début de l\'initialisation des 120 quêtes...');
    
    // Vider la table existante
    await connection.execute('DELETE FROM quests');
    console.log('🗑️ Table quests vidée');
    
    // Insérer toutes les quêtes
    let insertedCount = 0;
    
    for (const quest of allQuests) {
      const id = uuidv4();
      
      await connection.execute(
        `INSERT INTO quests (id, title, description, type, category, requirement, xpReward, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          quest.title,
          quest.description,
          quest.type,
          quest.category,
          quest.requirement,
          quest.xpReward,
          true // isActive
        ]
      );
      
      insertedCount++;
      
      if (insertedCount % 10 === 0) {
        console.log(`📊 ${insertedCount} quêtes insérées...`);
      }
    }
    
    console.log(`✅ ${insertedCount} quêtes initialisées avec succès !`);
    
    // Vérification finale
    const [result] = await connection.execute('SELECT COUNT(*) as total FROM quests');
    const [typeStats] = await connection.execute('SELECT type, COUNT(*) as count FROM quests GROUP BY type ORDER BY type');
    
    console.log(`📈 Total en base: ${result[0].total} quêtes`);
    console.log('📊 Répartition par type:');
    typeStats.forEach(stat => {
      console.log(`   ${stat.type}: ${stat.count} quêtes`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

// Vérifier que nous avons bien 120 quêtes
console.log(`🎯 Préparation de ${allQuests.length} quêtes`);
console.log('📊 Répartition prévue:');
console.log(`   Quotidiennes: ${allQuests.filter(q => q.type === 'daily').length}`);
console.log(`   Hebdomadaires: ${allQuests.filter(q => q.type === 'weekly').length}`);
console.log(`   Mensuelles: ${allQuests.filter(q => q.type === 'monthly').length}`);
console.log(`   Saisonnières (achievements): ${allQuests.filter(q => q.type === 'achievement' && q.category === 'event').length}`);

initializeQuests();
