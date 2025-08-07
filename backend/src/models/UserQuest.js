const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle UserQuest - Progression des quêtes par utilisateur
const UserQuest = sequelize.define('UserQuest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  questId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'quests',
      key: 'id'
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetDate: {
    type: DataTypes.DATE, // Pour les quêtes récurrentes
    allowNull: true
  }
}, {
  tableName: 'user_quests',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'questId']
    }
  ]
});

module.exports = UserQuest;
