const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle UserProgression - Progression globale de l'utilisateur
const UserProgression = sequelize.define('UserProgression', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalXP: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  currentXP: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nextLevelXP: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  badges: {
    type: DataTypes.JSON, // Array des badges débloqués
    defaultValue: []
  },
  titles: {
    type: DataTypes.JSON, // Array des titres débloqués
    defaultValue: []
  },
  currentTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  streamsDiscovered: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalWatchTime: {
    type: DataTypes.INTEGER, // En minutes
    defaultValue: 0
  },
  raidsInitiated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sponsorshipsCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subscriptionTier: {
    type: DataTypes.ENUM('free', 'supporter', 'champion', 'legende'),
    defaultValue: 'free'
  }
}, {
  tableName: 'user_progressions',
  timestamps: true
});

module.exports = UserProgression;
