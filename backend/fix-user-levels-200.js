const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration base de données (utilise les mêmes variables d'environnement)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'streamyscovery'
};

// Système de niveaux complet - 200 niveaux (identique au backend)
function getLevelSystem() {
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

function calculateLevel(totalXP) {
  const levels = getLevelSystem();
  
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

async function fixUserLevels() {
  let connection;
  
  try {
    console.log('🔗 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // Récupérer tous les utilisateurs avec leur progression
    const [users] = await connection.execute(
      'SELECT * FROM user_progressions'
    );
    
    console.log(`📊 ${users.length} utilisateurs trouvés`);
    
    for (const user of users) {
      const oldLevel = user.level;
      const oldCurrentXP = user.currentXP;
      const oldNextLevelXP = user.nextLevelXP;
      
      // Recalculer avec le nouveau système de 200 niveaux
      const newLevelInfo = calculateLevel(user.totalXP);
      
      if (oldLevel !== newLevelInfo.level || oldCurrentXP !== newLevelInfo.currentXP) {
        console.log(`🔄 Mise à jour utilisateur ${user.userId}:`);
        console.log(`   Ancien: Niveau ${oldLevel}, ${oldCurrentXP}/${oldNextLevelXP} XP`);
        console.log(`   Nouveau: Niveau ${newLevelInfo.level}, ${newLevelInfo.currentXP}/${newLevelInfo.nextLevelXP} XP`);
        
        // Mettre à jour la base de données
        await connection.execute(
          'UPDATE user_progressions SET level = ?, currentXP = ?, nextLevelXP = ? WHERE userId = ?',
          [newLevelInfo.level, newLevelInfo.currentXP, newLevelInfo.nextLevelXP, user.userId]
        );
        
        console.log('✅ Utilisateur mis à jour avec succès');
      } else {
        console.log(`✅ Utilisateur ${user.userId} déjà à jour (Niveau ${oldLevel})`);
      }
    }
    
    console.log('🎉 Tous les niveaux ont été recalculés avec le système de 200 niveaux !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction des niveaux:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixUserLevels();
