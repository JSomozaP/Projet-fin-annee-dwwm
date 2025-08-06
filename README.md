# 🎮 Streamyscovery - Découvreur de Streams Twitch Intelligent

> **Application de découverte de streams Twitch axée sur les petits streamers, avec système de cache intelligent pour éviter les limitations API**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-17-red.svg)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://mysql.com/)
[![Twitch API](https://img.shields.io/badge/Twitch-API%20v5-purple.svg)](https://dev.twitch.tv/)

## 🎯 **Mission**

Streamyscovery permet de **découvrir facilement les petits streamers** (1-10 viewers) souvent noyés dans la masse, tout en offrant la possibilité d'explorer les streamers populaires. L'application met l'accent sur :

- 🔍 **Découverte de petits streamers** avec moins de 10 viewers
- 🌍 **Filtrage multilingue** (français, anglais, espagnol, chinois, etc.)
- 🎮 **Recherche par jeu** avec autocomplétion intelligente
- 👤 **Recherche de streamers spécifiques** par nom (en live ou hors ligne)
- ⭐ **Système de favoris** avec confirmation de suppression
- ⚡ **Performance optimisée** grâce à un système de cache avancé
- 📱 **Interface moderne** avec visualisation plein écran des streams

## 🏗️ **Architecture**

```
Streamyscovery/
├── 🖥️  frontend/           # Application Angular 17
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── discovery/  # Composant principal de découverte
│   │   │   ├── favorites/  # Gestion des favoris
│   │   │   └── stream-viewer/ # Visualiseur plein écran
│   │   └── services/
│   │       ├── auth.service.ts      # Authentification Twitch OAuth
│   │       ├── stream.service.ts    # Communication API streams
│   │       └── favorite.service.ts  # Gestion favoris
│   └── environments/       # Configuration environnements
├── 🔧 backend/             # API Express.js + MySQL
│   ├── src/
│   │   ├── controllers/    # Logique métier API
│   │   ├── services/
│   │   │   ├── twitchService.js        # 🔥 Cœur de l'app - Intégration Twitch
│   │   │   ├── gameCache.js            # 🚀 Cache intelligent des jeux
│   │   │   └── streamCacheManager.js   # 🚀 Cache intelligent des streams
│   │   ├── models/         # Modèles base de données
│   │   ├── routes/         # Routes API Express
│   │   └── middleware/     # Authentification, CORS, etc.
│   └── package.json
└── 📊 database/           # Schémas MySQL
    └── schema.sql
```

## 🚀 **Système de Cache Intelligent**

### **🎮 Cache des Jeux (GameCache)**

**Problème résolu :** Éviter les appels API répétés pour la recherche de jeux

**Fonctionnement :**
- **Jeux populaires pré-chargés** : Top 50 jeux Twitch mis à jour automatiquement toutes les 24h
- **Cache dynamique** : Résultats de recherche stockés pour réutilisation
- **Recherche instantanée** : 80% des recherches de jeux sont instantanées

```javascript
// Exemple : Recherche "World of Warcraft"
🎮 Recherche de jeux optimisée: wo
✅ 5 jeux trouvés dans le cache  // Instantané !
```

### **🏊 Cache des Streams (StreamCacheManager)**

**Problème résolu :** Éviter de surcharger l'API Twitch avec des centaines d'utilisateurs

**Organisation en pools :**
```javascript
"fr_18122_small"  → Streams français de WoW, petits streamers
"en_all_any"      → Streams anglais, tous jeux, tous viewers  
"zh_18122_any"    → Streams chinois de WoW, tous viewers
```

**Stratégie de mise en cache :**
- **Durée de vie** : 5 minutes par pool
- **Capacité** : 200 streams max par pool
- **Nettoyage automatique** : Toutes les 10 minutes
- **Diversité maintenue** : Stream aléatoire à chaque demande

### **🌍 Couverture Universelle des Pools**

**Les pools peuvent couvrir TOUS les contextes possibles :**
- **🎮 N'importe quel jeu** : World of Warcraft, League of Legends, Minecraft, ou `'all'` pour tous les jeux
- **🌍 N'importe quelle langue** : `fr`, `en`, `zh`, `es`, `ru`, `de`, `ja`, etc.
- **👥 N'importe quel nombre de viewers** : `small` (< 100), `large` (> 1000), ou `any` pour tous

### **⚡ Exemple Concret d'Utilisation**

**Scénario :** 4 utilisateurs recherchent en même temps
```javascript
// Utilisateur A : Streams WoW français petits streamers
Recherche: { langue: "fr", jeu: "World of Warcraft", maxViewers: 50 }
🔥 Appel API → Crée le pool "fr_18122_small" avec 67 streams

// Utilisateur B : Même recherche 2 minutes après  
Recherche: { langue: "fr", jeu: "World of Warcraft", maxViewers: 80 }
💾 Cache HIT → Utilise "fr_18122_small" existant (instantané !)

// Utilisateur C : WoW anglais tous viewers
Recherche: { langue: "en", jeu: "World of Warcraft" }
🔥 Appel API → Crée le pool "en_18122_any" avec 156 streams

// Utilisateur D : Tous jeux français
Recherche: { langue: "fr" }
🔥 Appel API → Crée le pool "fr_all_any" avec 200 streams
```

**Résultat :** 4 recherches = seulement 3 appels API au lieu de 4 ! 🎉

### **📊 Performance obtenue**

```bash
cd backend
npm install

# Configuration environnement
cp .env.example .env
# Remplir les variables Twitch et MySQL dans .env

# Base de données
mysql -u root -p < ../database/schema.sql

# Lancement
npm start
# 🚀 Server is running on port 3000
```

### **3. Frontend Setup**
```bash
cd frontend
npm install

# Configuration environnement  
# Modifier src/environments/environment.ts avec l'URL backend

# Lancement développement
ng serve
# 📱 Application accessible sur http://localhost:4200
```

## 🎮 **Fonctionnalités**

### **🔍 Découverte Intelligente**
- **Stratégie adaptive** : Petits streamers vs streamers populaires
- **Filtrage avancé** : Par jeu, langue, nombre de viewers
- **Exclusion de doublons** : Évite de revoir les mêmes streams

### **👤 Recherche de Streamers Spécifiques**
- **Recherche en temps réel** : Trouvez n'importe quel streamer Twitch par nom
- **Support streamers hors ligne** : Informations complètes même si pas en live
- **Détection automatique du statut** : Distinction claire entre live/hors ligne
- **Intégration complète** : Ajout aux favoris et visualisation directe

### **⭐ Système de Favoris**
- **Sauvegarde persistante** en base de données
- **Authentification OAuth Twitch** optionnelle
- **Gestion des favoris** avec interface dédiée
- **Confirmation de suppression** : Modal de confirmation pour éviter les suppressions accidentelles
- **Animations fluides** : Interface moderne avec transitions CSS

### **🌍 Support Multilingue**
- Français, Anglais, Espagnol, Chinois, Russe, Allemand...
- Détection automatique selon les préférences utilisateur
- Interface adaptée aux différentes langues

### **⚡ Recherche de Jeux**
- **Autocomplétion intelligente** avec cache
- **Catalogue complet Twitch** via `/search/categories`
- **Recherche typo-tolérante** pour les noms de jeux

### **📱 Visualisation Streams**
- **Mode plein écran** immersif
- **Player Twitch intégré** avec contrôles natifs
- **Informations streamer** : Viewers, langue, catégorie

## 📊 **API Endpoints**

### **Streams**
```http
GET  /api/streams/discover                    # Découverte intelligente
GET  /api/streams/random                      # Stream aléatoire  
GET  /api/streams/search-streamer/:name       # 🆕 Recherche streamer spécifique
GET  /api/streams/games/search?query=         # Recherche jeux autocomplete
GET  /api/streams/cache/stats                 # Statistiques cache
POST /api/streams/cache/refresh               # Rafraîchir cache
POST /api/streams/cache/update-games          # Force update jeux populaires
```

### **Authentification**
```http
GET  /api/auth/twitch                   # Initier OAuth Twitch
GET  /api/auth/callback                 # Callback OAuth
POST /api/auth/logout                   # Déconnexion
```

### **Favoris**
```http
GET    /api/favorites                   # Liste des favoris
POST   /api/favorites                   # Ajouter favori
DELETE /api/favorites/:streamerId       # Supprimer favori
```

## 🔬 **Architecture Technique Détaillée**

### **🎯 TwitchService - Cœur de l'Application**

**Stratégies de découverte :**
```javascript
// Petits streamers (< 100 viewers)
async getSmallStreams(filters) {
  // Cherche dans des catégories moins populaires
  // Art, Music, Indie Games, etc.
}

// Streamers populaires (> 100 viewers)  
async getRegularStreams(filters) {
  // Utilise l'endpoint standard /streams
}
```

**Transformation des données :**
```javascript
// Standardisation format frontend
formatStreamForFrontend(twitchStream) {
  return {
    streamerId: stream.user_id,
    streamerName: stream.user_name,
    titre: stream.title,
    jeu: stream.game_name,
    langue: stream.language,
    nbViewers: stream.viewer_count,
    thumbnailUrl: stream.thumbnail_url,
    embedUrl: `https://player.twitch.tv/?channel=${stream.user_login}`
  };
}
```

### **🧠 Algorithme de Cache Intelligent**

**Gestion des pools :**
```javascript
// Clé unique pour chaque contexte
getPoolKey(language, gameId, viewerRange) {
  return `${language}_${gameId || 'all'}_${viewerRange || 'any'}`;
}

// Exemple de pools générés :
fr_all_any        → 100 streams français, tous jeux
en_18122_small    → 15 streams anglais WoW < 100 viewers
zh_18122_any      → 25 streams chinois WoW tous viewers
```

**Rotation automatique :**
- **Expiration** : 5 minutes pour fraîcheur des données
- **Fusion intelligente** : Nouveaux streams + cache existant
- **Déduplication** : Évite les doublons par `user_id`

### **👤 Algorithme de Recherche de Streamers**

**Pipeline de recherche :**
```javascript
// 1. Recherche utilisateur Twitch
const streamerInfo = await twitchService.getUserByLogin(streamerName);

// 2. Vérification du statut live
const streamData = await twitchService.isStreamerLive(streamerInfo.id);

// 3. Normalisation des données
const normalizedData = {
  id: streamerInfo.id,
  display_name: streamerInfo.display_name,
  isLive: streamData !== null,
  viewer_count: streamData?.viewer_count || 0,
  game_name: streamData?.game_name || 'Hors ligne'
};
```

**Gestion des cas d'usage :**
- **Streamer en live** : Données complètes du stream actuel
- **Streamer hors ligne** : Informations de profil avec statut offline
- **Streamer inexistant** : Message d'erreur informatif
- **Erreur API** : Fallback gracieux avec cache si disponible

### **🔒 Sécurité & Authentification**

**OAuth Twitch :**
- **Scopes minimaux** : `user:read:email` uniquement
- **Tokens sécurisés** : Stockage client-side temporaire
- **Middleware auth** : Vérification optionnelle pour favoris

**Protection API :**
- **Rate limiting** : Respect des limites Twitch
- **Fallback gracieux** : Cache de secours si API indisponible
- **Variables d'environnement** : Secrets protégés

## 📈 **Monitoring & Maintenance**

### **Logs Intelligents**
```javascript
// Exemples de logs en production
🎯 Utilisation du cache pour fr_18122_small: 53 streams disponibles
🌐 Appel API Twitch pour: World of Warcraft  
💾 Cache mis à jour pour en_all_any: 100 streams
✅ 38 streams correspondent aux critères
```

### **Métriques Clés**
- **Taux de cache hit** : % de requêtes servies par le cache
- **Appels API/minute** : Monitoring de la consommation
- **Temps de réponse** : Performance des endpoints
- **Pools actifs** : Nombre de caches maintenus

### **Santé du Système**
```bash
# Statistiques temps réel
GET /api/streams/cache/stats

{
  "streamCacheStats": {
    "totalPools": 8,
    "pools": [
      {
        "key": "fr_18122_small", 
        "streamCount": 53,
        "isExpired": false
      }
    ]
  },
  "gameCacheStats": {
    "popularGamesCount": 50,
    "lastUpdate": "2025-01-31T14:30:00Z",
    "topGames": ["Just Chatting", "League of Legends", ...]
  }
}
```

## 🚧 **Développement & Contribution**

### **Structure du Code**
- **Modularité** : Services indépendants et réutilisables  
- **Séparation des responsabilités** : MVC strict
- **Cache transparent** : Logique invisible pour les contrôleurs
- **Typage TypeScript** : Interfaces pour tous les échanges de données

### **Tests & Debugging**
- **Logs détaillés** : Chaque étape tracée avec emojis 🔍
- **Fallback robuste** : Aucun crash même si API Twitch en panne
- **Mode debug** : Variables d'environnement pour plus de logs

### **Évolutions Prévues**
- [x] **Recherche de streamers spécifiques** : Implémenté (Août 2025)
- [x] **Confirmation de suppression favoris** : Implémenté (Août 2025)
- [ ] **Recommandations IA** : Suggestions basées sur l'historique
- [ ] **Statistiques streamers** : Graphiques de croissance
- [ ] **Notifications** : Alerte quand streamer favori en ligne
- [ ] **Mode hors-ligne** : Cache persistant pour usage nomade
- [ ] **Filtres avancés** : Par tags, catégories personnalisées
- [ ] **Partage social** : Partage de découvertes sur réseaux sociaux

## 🤝 **Remerciements**

- **Twitch** pour l'API riche et bien documentée
- **Communauté Angular** pour les outils modernes
- **Streamers découverts** qui donnent du sens au projet ! 🎮

---

**💡 Streamyscovery : Parce que chaque petit streamer mérite sa chance !**

*Développé avec ❤️ pour la communauté gaming*

## 🆕 **Dernières Améliorations (Août 2025)**

### **🔍 Recherche de Streamers Spécifiques**
- **Fonctionnalité complète** : Recherche de n'importe quel streamer Twitch par nom
- **Support hors ligne** : Affichage des informations même pour les streamers non actifs
- **API backend robuste** : Intégration avec l'API Twitch pour données temps réel
- **Interface utilisateur intuitive** : Champ de recherche dédié avec autocomplétion
- **Gestion d'erreurs** : Messages informatifs selon le statut du streamer

**Exemple d'utilisation :**
```typescript
// Recherche en temps réel pendant la saisie
onStreamerSearchChange(streamerName: string) {
  if (streamerName.trim().length >= 3) {
    this.searchSpecificStreamer(streamerName.trim());
  }
}
```

### **⭐ Amélioration du Système de Favoris**
- **Modal de confirmation** : Prévention des suppressions accidentelles
- **Animations CSS** : Transitions fluides (fadeIn, slideIn)
- **Design responsive** : Interface adaptée mobile et desktop
- **Gestion d'état robuste** : Réactualisation automatique après suppression

**Fonctionnalités du modal :**
```html
<!-- Modal avec animations CSS natives -->
<div class="modal-overlay" [class.show]="showDeleteConfirmation">
  <div class="modal-content">
    <h3>Confirmer la suppression</h3>
    <p>Êtes-vous sûr de vouloir supprimer ce favori ?</p>
    <button (click)="confirmDeleteFavorite()">Confirmer</button>
    <button (click)="cancelDelete()">Annuler</button>
  </div>
</div>
```

### **🔧 Améliorations Techniques**

#### **Backend - Intégration Twitch API**
- **Nouvelle route** : `/api/streams/search-streamer/:name`
- **Service TwitchService amélioré** :
  - `getUserByLogin()` : Récupération des données utilisateur
  - `isStreamerLive()` : Vérification du statut en live avec données complètes
  - Gestion des erreurs et fallbacks gracieux

#### **Frontend - TypeScript & Interfaces**
- **Interfaces étendues** : Support des nouvelles propriétés de l'API
- **Stream interface** : Ajout de `isLive`, `viewer_count`, etc.
- **Normalisation des données** : Compatibilité entre différents formats d'API
- **Gestion d'erreurs robuste** : Validation des données et fallbacks

### **🎨 Améliorations UX/UI**
- **Feedback visuel** : Indicateurs de chargement pendant les recherches
- **Messages informatifs** : Distinction claire entre streamers en ligne/hors ligne
- **Prévention d'erreurs** : Validation des saisies et confirmations
- **Interface cohérente** : Design uniforme entre découverte et recherche spécifique

### **📈 Performances**
- **Optimisation des appels API** : Cache intelligent pour les recherches fréquentes
- **Debouncing** : Évite les appels API excessifs pendant la saisie
- **Gestion mémoire** : Nettoyage automatique des données obsolètes
- **TypeScript strict** : Prévention des erreurs à la compilation

## 🔧 **Installation & Configuration**

### **Prérequis**
- Node.js v18+
- MySQL 8.0+
- Compte développeur Twitch (pour API keys)

### **1. Configuration Twitch API**
1. Créer une application sur [Twitch Developers](https://dev.twitch.tv/)
2. Récupérer `Client ID` et `Client Secret`
3. Configurer l'URL de redirection OAuth

### **2. Backend Setup**
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
