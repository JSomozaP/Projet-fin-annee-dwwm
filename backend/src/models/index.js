// Exportation centralisée de tous les modèles
const User = require('./User');
const StreamCache = require('./StreamCache');
const Favorite = require('./Favorite');
const Quest = require('./Quest');
const UserQuest = require('./UserQuest');
const UserProgression = require('./UserProgression');

// Définir les relations
Quest.hasMany(UserQuest, { foreignKey: 'questId' });
UserQuest.belongsTo(Quest, { foreignKey: 'questId' });

module.exports = {
  User,
  StreamCache,
  Favorite,
  Quest,
  UserQuest,
  UserProgression
};
