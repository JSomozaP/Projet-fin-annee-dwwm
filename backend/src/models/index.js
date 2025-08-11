// Exportation centralisée de tous les modèles
const User = require('./User');
const StreamCache = require('./StreamCache');
const Favorite = require('./Favorite');
const Quest = require('./Quest');
const UserQuest = require('./UserQuest');
const UserProgression = require('./UserProgression');

module.exports = {
  User,
  StreamCache,
  Favorite,
  Quest,
  UserQuest,
  UserProgression
};
