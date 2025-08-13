-- Migration Script: Twitchscovery → Streamyscovery
-- Date: 13 août 2025
-- Objectif: Renommer la base de données sans perdre les données

-- ÉTAPE 1: Créer la nouvelle base de données
CREATE DATABASE IF NOT EXISTS streamyscovery;

-- ÉTAPE 2: Copier toutes les tables avec leurs données
-- Table utilisateur
CREATE TABLE streamyscovery.utilisateur LIKE twitchscovery.utilisateur;
INSERT INTO streamyscovery.utilisateur SELECT * FROM twitchscovery.utilisateur;

-- Table stream
CREATE TABLE streamyscovery.stream LIKE twitchscovery.stream;
INSERT INTO streamyscovery.stream SELECT * FROM twitchscovery.stream;

-- Table favori
CREATE TABLE streamyscovery.favori LIKE twitchscovery.favori;
INSERT INTO streamyscovery.favori SELECT * FROM twitchscovery.favori;

-- Table quest
CREATE TABLE streamyscovery.quest LIKE twitchscovery.quest;
INSERT INTO streamyscovery.quest SELECT * FROM twitchscovery.quest;

-- Table user_quest
CREATE TABLE streamyscovery.user_quest LIKE twitchscovery.user_quest;
INSERT INTO streamyscovery.user_quest SELECT * FROM twitchscovery.user_quest;

-- Table user_progressions
CREATE TABLE streamyscovery.user_progressions LIKE twitchscovery.user_progressions;
INSERT INTO streamyscovery.user_progressions SELECT * FROM twitchscovery.user_progressions;

-- Table session_visionnage
CREATE TABLE streamyscovery.session_visionnage LIKE twitchscovery.session_visionnage;
INSERT INTO streamyscovery.session_visionnage SELECT * FROM twitchscovery.session_visionnage;

-- Table historique_recherche
CREATE TABLE streamyscovery.historique_recherche LIKE twitchscovery.historique_recherche;
INSERT INTO streamyscovery.historique_recherche SELECT * FROM twitchscovery.historique_recherche;

-- Table popular_games
CREATE TABLE streamyscovery.popular_games LIKE twitchscovery.popular_games;
INSERT INTO streamyscovery.popular_games SELECT * FROM twitchscovery.popular_games;

-- ÉTAPE 3: Vérifier l'intégrité des données
SELECT 'utilisateur' as table_name, COUNT(*) as count FROM streamyscovery.utilisateur
UNION ALL
SELECT 'stream', COUNT(*) FROM streamyscovery.stream
UNION ALL
SELECT 'favori', COUNT(*) FROM streamyscovery.favori
UNION ALL
SELECT 'quest', COUNT(*) FROM streamyscovery.quest
UNION ALL
SELECT 'user_quest', COUNT(*) FROM streamyscovery.user_quest
UNION ALL
SELECT 'user_progressions', COUNT(*) FROM streamyscovery.user_progressions
UNION ALL
SELECT 'session_visionnage', COUNT(*) FROM streamyscovery.session_visionnage
UNION ALL
SELECT 'historique_recherche', COUNT(*) FROM streamyscovery.historique_recherche
UNION ALL
SELECT 'popular_games', COUNT(*) FROM streamyscovery.popular_games;

-- ÉTAPE 4: Une fois la migration validée, supprimer l'ancienne base
-- DROP DATABASE twitchscovery; -- À décommenter après validation

-- ÉTAPE 5: Utiliser la nouvelle base
USE streamyscovery;
