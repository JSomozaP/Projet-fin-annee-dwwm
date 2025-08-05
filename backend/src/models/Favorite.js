const { pool } = require('../config/database');

class Favorite {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.streamerId = data.streamer_id;
    this.streamerName = data.streamer_name;
    this.streamerAvatar = data.streamer_avatar;
    this.dateAjout = data.date_ajout;
    this.notificationActive = data.notification_active;
  }

  // Ajouter un favori
  static async create(favoriteData) {
    const { 
      userId,           // Utiliser userId au lieu de utilisateurId pour cohérence
      streamerId, 
      streamerName, 
      gameId = null, 
      gameName = null,
      streamerAvatar = null, 
      notificationActive = true 
    } = favoriteData;

    try {
      // Vérifier si le favori existe déjà
      const existing = await Favorite.findByUserAndStreamer(userId, streamerId);
      if (existing) {
        throw new Error('Ce streamer est déjà dans vos favoris');
      }

      const [result] = await pool.execute(
        `INSERT INTO chaine_favorite 
         (user_id, streamer_id, streamer_name, streamer_avatar, notification_active) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, streamerId, streamerName, streamerAvatar, notificationActive]
      );

      return await Favorite.findByUserAndStreamer(userId, streamerId);
    } catch (error) {
      throw new Error(`Erreur ajout favori: ${error.message}`);
    }
  }

  // Trouver par ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM chaine_favorite WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new Favorite(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erreur recherche favori: ${error.message}`);
    }
  }

  // Trouver par utilisateur et streamer
  static async findByUserAndStreamer(userId, streamerId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM chaine_favorite WHERE user_id = ? AND streamer_id = ?',
        [userId, streamerId]
      );
      
      return rows.length > 0 ? new Favorite(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erreur recherche favori utilisateur/streamer: ${error.message}`);
    }
  }

  // Obtenir tous les favoris d'un utilisateur
  static async findByUserId(userId, options = {}) {
    try {
      let query = 'SELECT * FROM chaine_favorite WHERE user_id = ?';
      const params = [userId];

      // Filtrer par notification active si demandé
      if (options.notificationActive !== undefined) {
        query += ' AND notification_active = ?';
        params.push(options.notificationActive);
      }

      // Tri par date d'ajout (plus récent en premier)
      query += ' ORDER BY date_ajout DESC';

      // Limite si spécifiée
      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Favorite(row));
    } catch (error) {
      throw new Error(`Erreur recherche favoris utilisateur: ${error.message}`);
    }
  }

  // Compter les favoris d'un utilisateur
  static async countByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM chaine_favorite WHERE user_id = ?',
        [userId]
      );
      
      return rows[0].count;
    } catch (error) {
      throw new Error(`Erreur comptage favoris: ${error.message}`);
    }
  }

  // Obtenir les streamers les plus favoris
  static async getMostFavorited(limit = 10) {
    try {
      const [rows] = await pool.execute(
        `SELECT streamer_id, streamer_name, streamer_avatar, COUNT(*) as favorite_count
         FROM chaine_favorite 
         GROUP BY streamer_id, streamer_name, streamer_avatar
         ORDER BY favorite_count DESC 
         LIMIT ?`,
        [limit]
      );
      
      return rows;
    } catch (error) {
      throw new Error(`Erreur top favoris: ${error.message}`);
    }
  }

  // Mettre à jour les notifications
  async updateNotificationStatus(notificationActive) {
    try {
      await pool.execute(
        'UPDATE chaine_favorite SET notification_active = ? WHERE id = ?',
        [notificationActive, this.id]
      );
      
      this.notificationActive = notificationActive;
      return this;
    } catch (error) {
      throw new Error(`Erreur mise à jour notification: ${error.message}`);
    }
  }

  // Supprimer un favori
  async delete() {
    try {
      await pool.execute('DELETE FROM chaine_favorite WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      throw new Error(`Erreur suppression favori: ${error.message}`);
    }
  }

  // Supprimer par utilisateur et streamer
  static async deleteByUserAndStreamer(userId, streamerId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM chaine_favorite WHERE user_id = ? AND streamer_id = ?',
        [userId, streamerId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Erreur suppression favori: ${error.message}`);
    }
  }

  // Vérifier si un streamer est en favori pour un utilisateur
  static async isFavorite(userId, streamerId) {
    const favorite = await Favorite.findByUserAndStreamer(userId, streamerId);
    return favorite !== null;
  }

  // Supprimer un favori par utilisateur et streamer
  static async deleteByUserAndStreamer(userId, streamerId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM chaine_favorite WHERE user_id = ? AND streamer_id = ?',
        [userId, streamerId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Erreur suppression favori: ${error.message}`);
    }
  }

  // Obtenir les statistiques des favoris d'un utilisateur
  static async getUserStats(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
           COUNT(*) as totalFavorites,
           COUNT(DISTINCT streamer_id) as uniqueStreamers,
           MAX(date_ajout) as lastAdded,
           MIN(date_ajout) as firstAdded
         FROM chaine_favorite 
         WHERE user_id = ?`,
        [userId]
      );
      
      return rows[0];
    } catch (error) {
      throw new Error(`Erreur statistiques favoris: ${error.message}`);
    }
  }

  // Convertir en JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      streamer_id: this.streamerId,
      streamer_name: this.streamerName,
      streamer_avatar: this.streamerAvatar,
      created_at: this.dateAjout,  // Utiliser created_at pour cohérence avec le frontend
      date_ajout: this.dateAjout,  // Garder l'ancien nom pour compatibilité
      notification_active: this.notificationActive
    };
  }
}

module.exports = Favorite;
