const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle Quest - Définition des quêtes
const Quest = sequelize.define('Quest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'achievement'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  xpReward: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  badgeReward: {
    type: DataTypes.STRING, // ID du badge à débloquer
    allowNull: true
  },
  requirement: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  category: {
    type: DataTypes.STRING, // 'discovery', 'social', 'engagement', etc.
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  conditions: {
    type: DataTypes.JSON, // Conditions spécifiques de la quête
    allowNull: true
  }
}, {
  tableName: 'quests',
  timestamps: true
});

module.exports = Quest;
