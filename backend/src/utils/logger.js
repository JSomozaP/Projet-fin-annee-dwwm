// Système de logging avec niveaux configurables
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Niveau de log actuel (peut être modifié via variable d'environnement)
const currentLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

const logger = {
  error: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error('❌', message, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn('⚠️', message, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log('ℹ️', message, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log('🔍', message, ...args);
    }
  },
  
  // Logs spécialisés pour l'authentification (réduits par défaut)
  auth: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log('🔐', message, ...args);
    }
  },
  
  // Logs spécialisés pour le cache (réduits par défaut)
  cache: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log('💾', message, ...args);
    }
  },
  
  // Logs spécialisés pour les quêtes
  quest: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log('🎯', message, ...args);
    }
  }
};

module.exports = logger;
