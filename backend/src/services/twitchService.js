const axios = require('axios');
const { StreamCache } = require('../models');
require('dotenv').config();

class TwitchService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseURL = 'https://api.twitch.tv/helix';
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
        first: filters.limit || 100, // Plus de streams pour la découverte
        language: filters.language || ['fr', 'en'] // Plusieurs langues
      };

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

  // Découverte intelligente avec filtres (cœur de l'application)
  async discoverStream(filters = {}) {
    try {
      console.log('💫 Récupération de streams live depuis Twitch...');
      
      // Toujours récupérer les streams les plus récents depuis l'API Twitch
      const apiFilters = {
        limit: 100,
        language: filters.language || 'fr'
      };
      
      if (filters.game) {
        const gameInfo = await this.getGameByName(filters.game);
        if (gameInfo) apiFilters.game_id = gameInfo.id;
      }

      // Récupérer les streams live depuis Twitch
      const liveStreams = await this.getStreams(apiFilters);
      
      if (!liveStreams || liveStreams.length === 0) {
        console.log('❌ Aucun stream live trouvé');
        return null;
      }

      // Filtrer par nombre de viewers si spécifié
      let filteredStreams = liveStreams;
      if (filters.minViewers) {
        filteredStreams = filteredStreams.filter(stream => stream.viewer_count >= filters.minViewers);
      }
      if (filters.maxViewers) {
        filteredStreams = filteredStreams.filter(stream => stream.viewer_count <= filters.maxViewers);
      }

      if (filteredStreams.length === 0) {
        console.log('❌ Aucun stream ne correspond aux critères de viewers');
        return null;
      }

      // Sélectionner un stream aléatoire
      const randomStream = filteredStreams[Math.floor(Math.random() * filteredStreams.length)];
      
      // Retourner le stream formaté
      return {
        streamerId: randomStream.user_id,
        streamerName: randomStream.user_login,
        titre: randomStream.title,
        jeu: randomStream.game_name,
        categorie: randomStream.game_name,
        nbViewers: randomStream.viewer_count,
        langue: randomStream.language,
        pays: this.getCountryFromLanguage(randomStream.language),
        thumbnailUrl: randomStream.thumbnail_url.replace('{width}x{height}', '640x360'),
        embedUrl: `https://player.twitch.tv/?channel=${randomStream.user_login}&parent=localhost`,
        chatUrl: `https://www.twitch.tv/embed/${randomStream.user_login}/chat?parent=localhost`
      };
    } catch (error) {
      console.error('❌ Erreur découverte stream:', error.message);
      return null;
    }
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
}

module.exports = new TwitchService();
