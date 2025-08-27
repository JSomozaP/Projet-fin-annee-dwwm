const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration base de données (identique au projet)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'streamyscovery'
};

// Système de niveaux étendu - 200 niveaux (identique au frontend et questService)
const getLevelSystem = () => {
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
};

// Calculer le niveau basé sur l'XP total
const calculateLevel = (totalXP) => {
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
};

async function fixUserLevels() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connecté à la base de données');
    
    // Récupérer tous les utilisateurs avec progression
    const [users] = await connection.execute(
      'SELECT userId, totalXP, level, currentXP, nextLevelXP FROM user_progressions'
    );
    
    console.log(`📊 ${users.length} utilisateurs trouvés`);
    
    for (const user of users) {
      const { userId, totalXP } = user;
      
      // Calculer le niveau correct
      const correctLevel = calculateLevel(totalXP);
      
      console.log(`\n👤 Utilisateur ${userId}:`);
      console.log(`   Ancien: Level ${user.level}, XP ${user.currentXP}/${user.nextLevelXP}, Total ${user.totalXP}`);
      console.log(`   Nouveau: Level ${correctLevel.level}, XP ${correctLevel.currentXP}/${correctLevel.nextLevelXP}, Total ${correctLevel.totalXP}`);
      
      // Mettre à jour si nécessaire
      if (user.level !== correctLevel.level || 
          user.currentXP !== correctLevel.currentXP || 
          user.nextLevelXP !== correctLevel.nextLevelXP) {
        
        await connection.execute(
          'UPDATE user_progressions SET level = ?, currentXP = ?, nextLevelXP = ? WHERE userId = ?',
          [correctLevel.level, correctLevel.currentXP, correctLevel.nextLevelXP, userId]
        );
        
        console.log(`   ✅ Mis à jour!`);
      } else {
        console.log(`   ✨ Déjà correct`);
      }
    }
    
    console.log('\n🎉 Correction des niveaux terminée!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
fixUserLevels();
