/**
 * Streamyscovery - Twitch API Integration Service
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Service d'intégration avec l'API Twitch pour la découverte de streams.
 * Fonctionnalités : authentification, recherche de streams, cache intelligent.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

const axios = require('axios');
const { StreamCache } = require('../models');
const gameCache = require('./gameCache');
const streamCacheManager = require('./streamCacheManager');
require('dotenv').config();

class TwitchService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.tokenPromise = null; // Pour éviter les appels simultanés
    this.baseURL = 'https://api.twitch.tv/helix';
    
    // Cache pour les informations des streamers (30 minutes)
    this.streamerInfoCache = new Map();
    this.streamerCacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    // Nettoyage automatique du cache toutes les 10 minutes
    setInterval(() => {
      streamCacheManager.cleanExpiredCaches();
      this.cleanStreamerCache();
    }, 10 * 60 * 1000);
  }

  // Nettoyer le cache des streamers
  cleanStreamerCache() {
    const now = Date.now();
    for (const [key, value] of this.streamerInfoCache.entries()) {
      if (now > value.expiry) {
        this.streamerInfoCache.delete(key);
      }
    }
  }

  // Obtenir un token d'accès pour l'API Twitch
  async getAccessToken() {
    // Vérifier si le token est encore valide
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      });
      
      this.accessToken = response.data.access_token;
      // Le token expire dans expires_in secondes, on garde une marge de 10 minutes
      this.tokenExpiry = Date.now() + (response.data.expires_in - 600) * 1000;
      
      console.log('✅ Token Twitch obtenu avec succès');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention du token Twitch:', error.message);
      throw error;
    }
  }

  // Obtenir les streams en direct avec filtres et mise en cache
  async getStreams(filters = {}) {
    await this.getAccessToken();

    try {
      const params = {
        first: filters.limit || 100
      };

      // Filtrer par langue comme demandé
      if (filters.language) {
        params.language = filters.language;
      }

      if (filters.game_id) params.game_id = filters.game_id;
      if (filters.user_login) params.user_login = filters.user_login;

      const response = await axios.get(`${this.baseURL}/streams`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        },
        params
      });

      const streams = response.data.data;
      console.log(`✅ ${streams.length} streams récupérés depuis Twitch`);

      // Mettre en cache chaque stream
      for (const stream of streams) {
        await this.cacheStream(stream);
      }

      return streams;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des streams:', error.message);
      
      // En cas d'erreur API, retourner les streams en cache
      console.log('📦 Récupération des streams depuis le cache...');
      return await StreamCache.searchWithFilters(filters);
    }
  }

  // Mettre un stream en cache
  async cacheStream(twitchStream) {
    try {
      const streamData = {
        streamerId: twitchStream.user_id,
        streamerName: twitchStream.user_name,
        titre: twitchStream.title,
        jeu: twitchStream.game_name,
        categorie: twitchStream.game_name, // Pour l'instant même que le jeu
        nbViewers: twitchStream.viewer_count,
        langue: twitchStream.language,
        pays: this.getCountryFromLanguage(twitchStream.language),
        thumbnailUrl: twitchStream.thumbnail_url.replace('{width}x{height}', '640x360'),
        embedUrl: `https://player.twitch.tv/?channel=${twitchStream.user_login}`,
        isLive: true
      };

      await StreamCache.upsert(streamData);
    } catch (error) {
      console.error('❌ Erreur mise en cache stream:', error.message);
    }
  }

  // Obtenir un pays approximatif depuis la langue
  getCountryFromLanguage(language) {
    const languageCountryMap = {
      'fr': 'France',
      'en': 'USA',
      'es': 'Spain',
      'de': 'Germany',
      'it': 'Italy',
      'pt': 'Brazil',
      'ru': 'Russia',
      'ja': 'Japan',
      'ko': 'South Korea'
    };
    return languageCountryMap[language] || 'Unknown';
  }

  // Obtenir les informations d'un jeu par nom
  async getGameByName(gameName) {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      const response = await axios.get(`${this.baseURL}/games`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          name: gameName
        }
      });

      return response.data.data[0];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du jeu:', error.message);
      throw error;
    }
  }

  // Rechercher des jeux par nom (pour autocomplete) - OPTIMISÉ
  async searchGames(query) {
    console.log(`🎮 Recherche de jeux optimisée: ${query}`);
    
    // 1. Chercher d'abord dans le cache des jeux populaires
    const cachedResults = gameCache.searchGames(query);
    if (cachedResults.length > 0) {
      console.log(`✅ ${cachedResults.length} jeux trouvés dans le cache`);
      return cachedResults;
    }
    
    // 2. Si pas trouvé dans le cache, faire un appel API
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      console.log(`🌐 Appel API Twitch pour: ${query}`);
      // Utilisation de l'endpoint /search/categories qui permet la recherche dans tout le catalogue
      const response = await axios.get(`${this.baseURL}/search/categories`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          query: query,
          first: 10 // Réduit de 20 à 10 pour limiter les données
        }
      });

      // Retourner les noms des jeux/catégories trouvés
      const games = response.data.data.map(game => game.name);
      
      // 3. Mettre en cache le résultat
      gameCache.cacheApiResults(query, games);
      
      return games;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche de jeux:', error.message);
      // Fallback vers le cache même si partiel
      return cachedResults;
    }
  }

  // Rechercher un jeu spécifique par nom (retourne l'objet jeu complet) - OPTIMISÉ
  async searchGame(gameName) {
    console.log(`🎯 Recherche jeu spécifique: ${gameName}`);
    
    // 1. Chercher d'abord dans le cache des jeux populaires
    const cachedGame = gameCache.getGameByName(gameName);
    if (cachedGame) {
      console.log(`✅ Jeu trouvé dans le cache: ${cachedGame.name}`);
      return cachedGame;
    }
    
    // 2. Faire un appel API seulement si nécessaire
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      console.log(`🌐 Appel API pour jeu: ${gameName}`);
      const response = await axios.get(`${this.baseURL}/games`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          name: gameName
        }
      });

      return response.data.data[0] || null;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche du jeu:', error.message);
      return null;
    }
  }

  // Obtenir un stream aléatoire selon les filtres
  async getRandomStream(filters = {}) {
    try {
      let streams = await this.getStreams({
        limit: 100,
        language: filters.language
      });

      // Filtrer par nombre de viewers
      if (filters.minViewers || filters.maxViewers) {
        streams = streams.filter(stream => {
          const viewers = stream.viewer_count;
          const min = filters.minViewers || 0;
          const max = filters.maxViewers || Infinity;
          return viewers >= min && viewers <= max;
        });
      }

      // Filtrer par jeu si spécifié
      if (filters.game) {
        const game = await this.getGameByName(filters.game);
        if (game) {
          streams = streams.filter(stream => stream.game_id === game.id);
        }
      }

      // Sélectionner un stream aléatoire
      if (streams.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * streams.length);
      return streams[randomIndex];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du stream aléatoire:', error.message);
      throw error;
    }
  }

  // Découverte intelligente avec filtres (cœur de l'application) - OPTIMISÉ
  async discoverStream(filters = {}) {
    try {
      console.log('💫 Recherche de streams avec filtres:', filters);
      
      // 1. Essayer d'abord le cache
      const cachedStreams = await streamCacheManager.getStreamsFromPool(filters);
      if (cachedStreams && cachedStreams.length > 0) {
        console.log(`🎯 Stream trouvé dans le cache: ${cachedStreams.length} disponibles`);
        const randomStream = cachedStreams[Math.floor(Math.random() * cachedStreams.length)];
        return this.formatStreamForFrontend(randomStream);
      }
      
      let allStreams = [];
      
      // 2. Stratégie différente selon le type de recherche
      if (filters.maxViewers && parseInt(filters.maxViewers) < 100) {
        // Pour les petits streamers : rechercher dans des jeux moins populaires
        allStreams = await this.getSmallStreams(filters);
      } else {
        // Recherche normale
        allStreams = await this.getRegularStreams(filters);
      }
      
      if (!allStreams || allStreams.length === 0) {
        console.log('❌ Aucun stream trouvé');
        return null;
      }

      // 3. Mettre à jour le cache avec les nouveaux streams
      streamCacheManager.updateStreamPool(filters, allStreams);

      console.log(`📊 ${allStreams.length} streams trouvés pour filtrage`);

      // Debug: afficher quelques exemples de streams
      if (allStreams.length > 0) {
        console.log('🔍 Exemples de streams trouvés:');
        allStreams.slice(0, 3).forEach(stream => {
          console.log(`  - ${stream.user_name}: ${stream.viewer_count} viewers, ${stream.language}, ${stream.game_name}`);
        });
      }

      // Filtrer par nombre de viewers
      let filteredStreams = allStreams;
      
      // Filtrage par jeu si spécifié
      if (filters.gameId) {
        console.log(`🎮 Filtrage par jeu ID: ${filters.gameId}`);
        const beforeFilter = filteredStreams.length;
        filteredStreams = filteredStreams.filter(stream => stream.game_id === filters.gameId);
        console.log(`  - ${beforeFilter} → ${filteredStreams.length} streams après filtrage par jeu`);
      }
      
      // Filtrage par langue si spécifié
      if (filters.language) {
        console.log(`🌍 Filtrage par langue: ${filters.language}`);
        const beforeFilter = filteredStreams.length;
        filteredStreams = filteredStreams.filter(stream => stream.language === filters.language);
        console.log(`  - ${beforeFilter} → ${filteredStreams.length} streams après filtrage par langue`);
      }
      
      if (filters.minViewers !== undefined && filters.minViewers !== null) {
        const minViewers = parseInt(filters.minViewers);
        console.log(`🔢 Filtrage par minViewers: ${minViewers}`);
        const beforeFilter = filteredStreams.length;
        filteredStreams = filteredStreams.filter(stream => stream.viewer_count >= minViewers);
        console.log(`  - ${beforeFilter} → ${filteredStreams.length} streams après filtrage minViewers`);
      }
      if (filters.maxViewers !== undefined && filters.maxViewers !== null) {
        const maxViewers = parseInt(filters.maxViewers);
        console.log(`🔢 Filtrage par maxViewers: ${maxViewers}`);
        const beforeFilter = filteredStreams.length;
        filteredStreams = filteredStreams.filter(stream => stream.viewer_count <= maxViewers);
        console.log(`  - ${beforeFilter} → ${filteredStreams.length} streams après filtrage maxViewers`);
      }

      if (filteredStreams.length === 0) {
        console.log('❌ Aucun stream ne correspond aux critères');
        return null;
      }

      console.log(`✅ ${filteredStreams.length} streams correspondent aux critères`);

      // Sélectionner un stream aléatoire
      const randomStream = filteredStreams[Math.floor(Math.random() * filteredStreams.length)];
      
      // Transformer le stream au format attendé par le frontend
      return this.formatStreamForFrontend(randomStream);
    } catch (error) {
      console.error('❌ Erreur lors de la découverte du stream:', error.message);
      return null;
    }
  }

  // Transformer un stream Twitch au format attendé par le frontend
  formatStreamForFrontend(twitchStream) {
    if (!twitchStream) return null;
    
    return {
      streamerId: twitchStream.user_id,
      streamerName: twitchStream.user_name,
      titre: twitchStream.title,
      jeu: twitchStream.game_name,
      categorie: twitchStream.game_name,
      langue: twitchStream.language,
      pays: this.getCountryFromLanguage(twitchStream.language),
      nbViewers: twitchStream.viewer_count,
      thumbnailUrl: twitchStream.thumbnail_url ? twitchStream.thumbnail_url.replace('{width}x{height}', '640x360') : '',
      embedUrl: `https://player.twitch.tv/?channel=${twitchStream.user_login}`
    };
  }

  // Nettoyer les anciens streams et rafraîchir le cache
  async refreshCache() {
    try {
      console.log('🧹 Nettoyage du cache des streams...');
      
      // Marquer tous les streams comme hors ligne
      await StreamCache.markAllOffline();
      
      // Supprimer les anciens streams
      await StreamCache.cleanOldStreams();
      
      // Récupérer de nouveaux streams
      console.log('🔄 Rafraîchissement du cache...');
      await this.getStreams({ limit: 100 });
      
      console.log('✅ Cache rafraîchi avec succès');
    } catch (error) {
      console.error('❌ Erreur rafraîchissement cache:', error.message);
    }
  }

  // Obtenir les statistiques du cache
  async getCacheStats() {
    try {
      const totalStreams = await StreamCache.searchWithFilters({ limit: 1000 });
      const liveStreams = await StreamCache.searchWithFilters({ limit: 1000 });
      
      return {
        totalCached: totalStreams.length,
        currentlyLive: liveStreams.length,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur stats cache:', error.message);
      return { totalCached: 0, currentlyLive: 0, lastUpdate: null };
    }
  }

  // Obtenir les informations d'un streamer spécifique
  async getStreamerInfo(streamerId) {
    try {
      // D'abord chercher dans le cache
      const cachedStream = await StreamCache.findByStreamerId(streamerId);
      if (cachedStream) {
        return cachedStream;
      }

      // Si pas en cache, faire un appel API
      const token = await this.getAccessToken();
      
      const response = await axios.get('https://api.twitch.tv/helix/streams', {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`
        },
        params: {
          user_id: streamerId
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        const twitchStream = response.data.data[0];
        // Mettre en cache le stream trouvé
        await this.cacheStream(twitchStream);
        
        // Retourner le stream depuis le cache pour avoir le format unifié
        return await StreamCache.findByStreamerId(streamerId);
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur récupération streamer:', error.message);
      return null;
    }
  }

  // Méthodes pour différentes stratégies de recherche
  async getSmallStreams(filters) {
    console.log('🔍 Recherche de petits streamers...');
    
    // Pour les petits streamers, on cherche dans des jeux moins populaires
    const smallGames = [
      'Art', 'Music', 'Poker', 'Slots', 'Chess', 'Pool', 
      'Backgammon', 'Pictionary', 'Gartic Phone', 'Skribbl.io',
      'Retro', 'Indie Games', 'Speedrunning', 'Variety'
    ];
    
    let allStreams = [];
    
    // Si un jeu spécifique est demandé, l'utiliser
    if (filters.gameId) {
      const streams = await this.getStreams({
        game_id: filters.gameId,
        language: filters.language || 'fr',
        first: 100
      });
      if (streams) allStreams = allStreams.concat(streams);
    } else {
      // Sinon, chercher dans plusieurs jeux moins populaires
      for (const gameName of smallGames.slice(0, 3)) { // Limiter à 3 jeux pour éviter trop d'appels
        try {
          const gameInfo = await this.getGameByName(gameName);
          if (gameInfo) {
            const streams = await this.getStreams({
              game_id: gameInfo.id,
              language: filters.language || 'fr',
              first: 50
            });
            if (streams) allStreams = allStreams.concat(streams);
          }
        } catch (error) {
          console.log(`⚠️ Impossible de récupérer les streams pour ${gameName}`);
        }
      }
    }
    
    return allStreams;
  }

  async getRegularStreams(filters) {
    console.log('📺 Recherche de streams populaires...');
    
    const apiFilters = {
      first: 100,
      language: filters.language || 'fr'
    };
    
    // Passer le gameId correctement à l'API
    if (filters.gameId) {
      apiFilters.game_id = filters.gameId;
    }

    return await this.getStreams(apiFilters);
  }

  // Récupérer les informations d'un utilisateur par son login
  async getUserByLogin(login) {
    const cacheKey = `user_${login}`;
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (this.streamerInfoCache.has(cacheKey)) {
      const cachedData = this.streamerInfoCache.get(cacheKey);
      if (now < cachedData.expiry) {
        console.log(`🎯 Cache HIT pour ${login}`);
        return cachedData.data;
      } else {
        console.log(`⏰ Cache EXPIRED pour ${login}`);
        this.streamerInfoCache.delete(cacheKey);
      }
    }
    
    try {
      console.log(`🌐 API call pour ${login}`);
      await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/users`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          login: login
        }
      });

      // Retourner le premier utilisateur trouvé (ou tableau vide si aucun)
      const userData = response.data.data;
      
      // Mettre en cache le résultat
      this.streamerInfoCache.set(cacheKey, {
        data: userData,
        expiry: now + this.streamerCacheExpiry
      });
      
      console.log(`💾 Cache STORE pour ${login}`);
      return userData;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de l'utilisateur ${login}:`, error.message);
      return [];
    }
  }

  // Vérifier si un streamer est en live et retourner les infos du stream
  async isStreamerLive(userIdOrLogin) {
    try {
      await this.getAccessToken();
      
      // Vérifier si c'est un ID numérique ou un login
      const isUserId = /^\d+$/.test(userIdOrLogin);
      
      const response = await axios.get(`${this.baseURL}/streams`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: isUserId ? {
          user_id: userIdOrLogin
        } : {
          user_login: userIdOrLogin
        }
      });

      return response.data.data.length > 0 ? response.data.data[0] : null;
    } catch (error) {
      console.error(`❌ Erreur lors de la vérification du statut live de ${userIdOrLogin}:`, error.message);
      return null;
    }
  }

  // Obtenir les informations du stream actuel d'un streamer
  async getStreamInfo(streamerName) {
    try {
      await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/streams`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          user_login: streamerName
        }
      });

      if (response.data.data.length > 0) {
        return response.data.data[0]; // Retourne les infos du stream
      }
      
      return null; // Pas en live
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des infos stream de ${streamerName}:`, error.message);
      return null;
    }
  }
}

module.exports = new TwitchService();
