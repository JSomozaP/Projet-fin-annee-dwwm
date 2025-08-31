class GameCache {
  constructor() {
    this.cache = new Map();
    this.popularGames = new Map();
    this.lastUpdate = null;
    this.updateInterval = 24 * 60 * 60 * 1000; // 24h en millisecondes
    
    // Jeux de base pour démarrage immédiat (fallback)
    this.initFallbackGames();
    
    // Mise à jour automatique des jeux populaires
    this.schedulePopularGamesUpdate();
    
    // Charger les jeux populaires au démarrage
    this.updatePopularGamesFromAPI();
  }

  initFallbackGames() {
    // Jeux de base pour éviter un démarrage à vide
    const fallback = [
      { id: '509658', name: 'Just Chatting' },  // Toujours populaire
      { id: '26936', name: 'Music' },           // Catégorie stable
      { id: '509660', name: 'Art' },            // Catégorie stable
      { id: '27471', name: 'Minecraft' },       // Classique indémodable
      { id: '21779', name: 'League of Legends' } // Esport stable
    ];
    
    fallback.forEach(game => {
      this.popularGames.set(game.name.toLowerCase(), game);
    });
  }

  // Programmer la mise à jour automatique
  schedulePopularGamesUpdate() {
    // Mise à jour immédiate puis toutes les 24h
    setInterval(() => {
      this.updatePopularGamesFromAPI();
    }, this.updateInterval);
    
    console.log('🕐 Mise à jour automatique des jeux populaires programmée (24h)');
  }

  // Mettre à jour la liste depuis l'API Twitch
  async updatePopularGamesFromAPI() {
    try {
      console.log('🔄 Mise à jour des jeux populaires depuis Twitch API...');
      
      // Récupérer le token depuis TwitchService (éviter référence circulaire)
      const axios = require('axios');
      
      // Obtenir le token directement
      const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      });
      
      const token = tokenResponse.data.access_token;
      
      if (!token) {
        console.log('⚠️ Impossible de récupérer le token, utilisation du cache existant');
        return;
      }

      // Appel API pour récupérer les top 50 jeux
      const response = await axios.get('https://api.twitch.tv/helix/games/top', {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`
        },
        params: {
          first: 50 // Top 50 jeux les plus populaires
        }
      });

      const topGames = response.data.data;
      
      // Vider la liste actuelle et la remplacer
      this.popularGames.clear();
      
      // Ajouter les nouveaux jeux populaires
      topGames.forEach(game => {
        this.popularGames.set(game.name.toLowerCase(), {
          id: game.id,
          name: game.name
        });
      });

      this.lastUpdate = new Date();
      console.log(`✅ ${topGames.length} jeux populaires mis à jour (${this.lastUpdate.toISOString()})`);
      
      // Afficher quelques exemples
      const examples = topGames.slice(0, 5).map(g => g.name).join(', ');
      console.log(`🎮 Top 5 actuels: ${examples}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des jeux populaires:', error.message);
      console.log('🛡️ Conservation de la liste existante comme fallback');
    }
  }

  // Recherche intelligente avec fallback
  searchGames(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    // 1. Chercher dans les jeux populaires d'abord
    for (const [name, game] of this.popularGames) {
      if (name.includes(lowerQuery)) {
        results.push(game.name);
      }
    }
    
    // 2. Chercher dans le cache
    for (const [name, games] of this.cache) {
      if (name.includes(lowerQuery)) {
        results.push(...games);
      }
    }
    
    // Retourner les résultats uniques, populaires en premier
    return [...new Set(results)].slice(0, 10);
  }

  // Mettre en cache les résultats d'API
  cacheApiResults(query, results) {
    this.cache.set(query.toLowerCase(), results);
    
    // Nettoyer le cache si trop gros
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  // Récupérer un jeu par nom
  getGameByName(name) {
    return this.popularGames.get(name.toLowerCase()) || null;
  }

  // Forcer une mise à jour manuelle (pour debug/admin)
  async forceUpdate() {
    console.log('🔧 Force update demandée par administrateur');
    await this.updatePopularGamesFromAPI();
  }

  // Obtenir des statistiques du cache
  getStats() {
    return {
      popularGamesCount: this.popularGames.size,
      cacheSize: this.cache.size,
      lastUpdate: this.lastUpdate,
      nextUpdate: this.lastUpdate ? new Date(this.lastUpdate.getTime() + this.updateInterval) : null,
      topGames: Array.from(this.popularGames.values()).slice(0, 10),
      updateFrequency: '24h'
    };
  }

  // Vérifier si une mise à jour est nécessaire
  isUpdateNeeded() {
    if (!this.lastUpdate) return true;
    const timeSinceUpdate = Date.now() - this.lastUpdate.getTime();
    return timeSinceUpdate > this.updateInterval;
  }
}


module.exports = new GameCache();
