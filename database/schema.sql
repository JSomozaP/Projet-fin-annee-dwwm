-- Script de création de la base de données Streamyscovery
-- Basé sur le MCD créé

CREATE DATABASE IF NOT EXISTS streamyscovery;
USE streamyscovery;

-- Table des utilisateurs avec authentification Twitch
CREATE TABLE utilisateur (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  twitch_id VARCHAR(100) UNIQUE,
  twitch_token TEXT,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_connected BOOLEAN DEFAULT FALSE,
  preferences JSON
);

-- ========================================
-- NOUVELLES TABLES POUR LA GAMIFICATION
-- ========================================

-- Table des quêtes
CREATE TABLE quests (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type ENUM('daily', 'weekly', 'monthly', 'achievement') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  xpReward INT DEFAULT 0,
  badgeReward VARCHAR(100),
  requirement INT DEFAULT 1,
  category VARCHAR(100) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  conditions JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table de progression des quêtes par utilisateur
CREATE TABLE user_quests (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(100) NOT NULL,
  questId VARCHAR(36) NOT NULL,
  progress INT DEFAULT 0,
  isCompleted BOOLEAN DEFAULT FALSE,
  completedAt DATETIME NULL,
  resetDate DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (questId) REFERENCES quests(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_quest (userId, questId)
);

-- Table de progression globale des utilisateurs
CREATE TABLE user_progressions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(100) UNIQUE NOT NULL,
  level INT DEFAULT 1,
  totalXP INT DEFAULT 0,
  currentXP INT DEFAULT 0,
  nextLevelXP INT DEFAULT 1000,
  badges JSON DEFAULT ('[]'),
  titles JSON DEFAULT ('[]'),
  currentTitle VARCHAR(100),
  streamsDiscovered INT DEFAULT 0,
  totalWatchTime INT DEFAULT 0,
  raidsInitiated INT DEFAULT 0,
  sponsorshipsCreated INT DEFAULT 0,
  subscriptionTier ENUM('free', 'supporter', 'champion', 'legende') DEFAULT 'free',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- TABLES EXISTANTES
-- ========================================

-- Table pour les filtres de recherche sauvegardés
CREATE TABLE filtres_recherche (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  nom_filtre VARCHAR(100),
  pays VARCHAR(100),
  jeu VARCHAR(100),
  categorie VARCHAR(100),
  nb_viewers_min INT DEFAULT 0,
  nb_viewers_max INT DEFAULT 999999,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Table des chaînes favorites
CREATE TABLE chaine_favorite (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  streamer_id VARCHAR(100) NOT NULL,
  streamer_name VARCHAR(100) NOT NULL,
  streamer_avatar TEXT,
  date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
  notification_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_streamer (user_id, streamer_id)
);

-- Table de l'historique des recherches/découvertes
CREATE TABLE historique_recherche (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  pays VARCHAR(100),
  jeu VARCHAR(100),
  categorie VARCHAR(100),
  nb_viewers_min INT,
  nb_viewers_max INT,
  date_recherche DATETIME DEFAULT CURRENT_TIMESTAMP,
  resultat_streamer_id VARCHAR(100),
  temps_visionnage INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Table pour le cache des streams Twitch
CREATE TABLE stream_cache (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  streamer_id VARCHAR(100) UNIQUE NOT NULL,
  streamer_name VARCHAR(100) NOT NULL,
  titre TEXT,
  jeu VARCHAR(100),
  categorie VARCHAR(100),
  nb_viewers INT DEFAULT 0,
  langue VARCHAR(10),
  pays VARCHAR(100),
  thumbnail_url TEXT,
  embed_url TEXT,
  date_mise_a_jour DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_live BOOLEAN DEFAULT FALSE
);

-- Table pour l'historique des commandes/interactions
CREATE TABLE historique_commandes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  type_commande VARCHAR(100) NOT NULL,
  details JSON,
  date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
  statut VARCHAR(50) DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Table pour les votes/classements
CREATE TABLE vote_classement (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  streamer_id VARCHAR(100) NOT NULL,
  type_vote VARCHAR(50) NOT NULL,
  valeur INT NOT NULL,
  date_vote DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_streamer_vote (user_id, streamer_id, type_vote)
);

-- Table pour les interactions chat
CREATE TABLE interaction_chat (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  streamer_id VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  date_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
  type_interaction VARCHAR(50) DEFAULT 'message',
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Table pour les follows/subs via API Twitch
CREATE TABLE follow_sub_action (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  streamer_id VARCHAR(100) NOT NULL,
  type_action VARCHAR(50) NOT NULL,
  date_action DATETIME DEFAULT CURRENT_TIMESTAMP,
  statut VARCHAR(50) DEFAULT 'success',
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);
