const axios = require('axios');
require('dotenv').config();

class TwitchService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.accessToken = null;
    this.baseURL = 'https://api.twitch.tv/helix';
  }

  // Obtenir un token d'accès pour l'API Twitch
  async getAccessToken() {
    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      });
      
      this.accessToken = response.data.access_token;
      console.log('✅ Token Twitch obtenu avec succès');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention du token Twitch:', error.message);
      throw error;
    }
  }

  // Obtenir les streams en direct avec filtres
  async getStreams(filters = {}) {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      const params = {
        first: filters.limit || 20,
        language: filters.language || 'fr'
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

      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des streams:', error.message);
      throw error;
    }
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
}

module.exports = new TwitchService();
