/**
 * Streamyscovery - Index des modèles
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Ce fichier centralise l'exportation de tous les modèles
 * pour faciliter les imports dans l'application.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

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
