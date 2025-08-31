const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'streamyscovery'
};

// Système de niveaux mis à jour
function getLevelSystem() {
  return [
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
    { level: 25, requiredXP: 16200 },
    { level: 26, requiredXP: 17500 },
    { level: 27, requiredXP: 18850 },
    { level: 28, requiredXP: 20250 },
    { level: 29, requiredXP: 21700 },
    { level: 30, requiredXP: 23200 }
  ];
}

function calculateLevel(totalXP) {
  const levelSystem = getLevelSystem();
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
      nextLevelXP = nextLevel ? nextLevel.requiredXP : currentLevelXP + 1500; // Progression continue après niveau 30
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

async function updateUserLevel() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à MySQL réussie !');

    // Récupérer l'utilisateur pouikdev
    const [users] = await connection.execute(
      'SELECT * FROM user_progressions WHERE userId = ?',
      ['f7be123d-6c57-11f0-8ddb-d415e749b7bc']
    );

    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const user = users[0];
    console.log('👤 Utilisateur actuel:', {
      level: user.level,
      totalXP: user.totalXP,
      currentXP: user.currentXP,
      nextLevelXP: user.nextLevelXP
    });

    // Calculer le nouveau niveau
    const levelInfo = calculateLevel(user.totalXP);
    console.log('🎯 Nouveau niveau calculé:', levelInfo);

    // Mettre à jour en base
    await connection.execute(
      'UPDATE user_progressions SET level = ?, currentXP = ?, nextLevelXP = ? WHERE userId = ?',
      [levelInfo.level, levelInfo.currentXP, levelInfo.nextLevelXP, 'f7be123d-6c57-11f0-8ddb-d415e749b7bc']
    );

    console.log('✅ Niveau mis à jour avec succès !');
    console.log('📊 Nouveau niveau:', levelInfo.level);
    console.log('⚡ XP dans le niveau:', levelInfo.currentXP);
    console.log('🎯 XP requis pour le prochain niveau:', levelInfo.nextLevelXP);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

updateUserLevel();
