/**
 * Streamyscovery - Modèle utilisateur
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Ce modèle gère les données utilisateur, l'authentification Twitch,
 * et les interactions avec la base de données.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

const { pool } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.username = data.username;
    this.avatarUrl = data.avatar_url;
    this.twitchId = data.twitch_id;
    this.twitchToken = data.twitch_token;
    this.dateCreation = data.date_creation;
    this.isConnected = data.is_connected;
    this.preferences = data.preferences;
  }

  // Créer un nouvel utilisateur
  static async create(userData) {
    const { email, username, avatarUrl, twitchId, twitchToken, preferences = {} } = userData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO utilisateur (email, username, avatar_url, twitch_id, twitch_token, preferences, is_connected) 
         VALUES (?, ?, ?, ?, ?, ?, true)`,
        [email, username, avatarUrl, twitchId, twitchToken, JSON.stringify(preferences)]
      );
      
      // Récupérer l'utilisateur créé par son email (plus fiable que insertId avec UUID)
      return await User.findByEmail(email);
    } catch (error) {
      throw new Error(`Erreur création utilisateur: ${error.message}`);
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM utilisateur WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erreur recherche utilisateur: ${error.message}`);
    }
  }

  // Trouver un utilisateur par Twitch ID
  static async findByTwitchId(twitchId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM utilisateur WHERE twitch_id = ?',
        [twitchId]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erreur recherche utilisateur par Twitch ID: ${error.message}`);
    }
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM utilisateur WHERE email = ?',
        [email]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erreur recherche utilisateur par email: ${error.message}`);
    }
  }

  // Mettre à jour le statut de connexion
  async updateConnectionStatus(isConnected) {
    try {
      await pool.execute(
        'UPDATE utilisateur SET is_connected = ? WHERE id = ?',
        [isConnected, this.id]
      );
      
      this.isConnected = isConnected;
      return this;
    } catch (error) {
      throw new Error(`Erreur mise à jour connexion: ${error.message}`);
    }
  }

  // Mettre à jour le token Twitch
  async updateTwitchToken(token) {
    try {
      await pool.execute(
        'UPDATE utilisateur SET twitch_token = ? WHERE id = ?',
        [token, this.id]
      );
      
      this.twitchToken = token;
      return this;
    } catch (error) {
      throw new Error(`Erreur mise à jour token: ${error.message}`);
    }
  }

  // Mettre à jour les préférences
  async updatePreferences(preferences) {
    try {
      await pool.execute(
        'UPDATE utilisateur SET preferences = ? WHERE id = ?',
        [JSON.stringify(preferences), this.id]
      );
      
      this.preferences = preferences;
      return this;
    } catch (error) {
      throw new Error(`Erreur mise à jour préférences: ${error.message}`);
    }
  }

  // Mettre à jour l'avatar
  async updateAvatar(avatarUrl) {
    try {
      await pool.execute(
        'UPDATE utilisateur SET avatar_url = ? WHERE id = ?',
        [avatarUrl, this.id]
      );
      
      this.avatarUrl = avatarUrl;
      return this;
    } catch (error) {
      throw new Error(`Erreur mise à jour avatar: ${error.message}`);
    }
  }

  // Supprimer un utilisateur
  async delete() {
    try {
      await pool.execute('DELETE FROM utilisateur WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      throw new Error(`Erreur suppression utilisateur: ${error.message}`);
    }
  }

  // Convertir en objet JSON (sans le token pour la sécurité)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      avatar_url: this.avatarUrl,
      twitchId: this.twitchId,
      dateCreation: this.dateCreation,
      isConnected: this.isConnected,
      preferences: typeof this.preferences === 'string' 
        ? JSON.parse(this.preferences) 
        : this.preferences
    };
  }
}

module.exports = User;
