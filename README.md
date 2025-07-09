# Twitchscovery

Projet de fin d'année - Application de découverte de streamers Twitch

## Description

Twitchscovery permet aux utilisateurs de découvrir de nouveaux streamers sur Twitch de manière aléatoire, avec la possibilité d'appliquer des filtres par pays, jeu et nombre de viewers.

## Technologies utilisées

### Frontend
- Angular 17+
- TypeScript
- CSS/SCSS

### Backend
- Node.js
- Express.js
- MySQL
- JWT pour l'authentification

### API externe
- Twitch API Helix

## Structure du projet

```
projet-fin-annee/
├── frontend/                    # Application Angular
├── backend/                     # API Node.js
├── database/                    # Scripts SQL
├── synopsis.md                  # Description du projet
├── twitchscovery.dbml          # Modèle de base de données
├── MCD Twitchscovery 2_*.png   # Diagramme MCD
├── Twitchscovery use case2.drawio.png  # Diagramme de cas d'usage
├── INSTALLATION.md             # Guide d'installation
└── README.md
```

## Installation

### Prérequis
- Node.js (v18+)
- MySQL
- Compte développeur Twitch

### Installation du backend
```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npm run dev
```

### Installation du frontend
```bash
cd frontend
npm install
ng serve
```

### Base de données
```bash
mysql -u root -p < database/schema.sql
```

## Configuration

1. Créer un compte développeur sur [dev.twitch.tv](https://dev.twitch.tv)
2. Obtenir le Client ID et Client Secret
3. Configurer le fichier `.env` dans le backend
4. Configurer les variables d'environnement dans Angular

## Fonctionnalités

- Recherche aléatoire de streamers
- Filtres par pays, jeu, nombre de viewers
- Authentification via Twitch
- Système de favoris
- Historique des recherches
- Chat intégré
- Follow/Sub via API Twitch
- Système de votes/classements

## Auteur

Projet de fin d'année 2025
