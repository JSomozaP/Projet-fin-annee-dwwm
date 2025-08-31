const { pool } = require('../config/database');

class StreamCache {
  constructor(data) {
    this.id = data.id;
    this.streamerId = data.streamer_id;
    this.streamerName = data.streamer_name;
    this.titre = data.titre;
    this.jeu = data.jeu;
    this.categorie = data.categorie;
    this.nbViewers = data.nb_viewers;
    this.langue = data.langue;
    this.pays = data.pays;
    this.thumbnailUrl = data.thumbnail_url;
    this.embedUrl = data.embed_url;
    this.dateMiseAJour = data.date_mise_a_jour;
    this.isLive = data.is_live;
  }

  // Créer ou mettre à jour un stream
  static async upsert(streamData) {
    const {
      streamerId, streamerName, titre, jeu, categorie,
      nbViewers, langue, pays, thumbnailUrl, embedUrl, isLive
    } = streamData;

    try {
      const [existing] = await pool.execute(
        'SELECT id FROM stream_cache WHERE streamer_id = ?',
        [streamerId]
      );

      if (existing.length > 0) {
        // Mise à jour
        await pool.execute(
          `UPDATE stream_cache SET 
           streamer_name = ?, titre = ?, jeu = ?, categorie = ?,
           nb_viewers = ?, langue = ?, pays = ?, thumbnail_url = ?,
           embed_url = ?, is_live = ?, date_mise_a_jour = NOW()
           WHERE streamer_id = ?`,
          [streamerName, titre, jeu, categorie, nbViewers, langue, pays, 
           thumbnailUrl, embedUrl, isLive, streamerId]
        );
        
        return await StreamCache.findByStreamerId(streamerId);
      } else {
        // Création
        const [result] = await pool.execute(
          `INSERT INTO stream_cache 
           (streamer_id, streamer_name, titre, jeu, categorie, nb_viewers, 
            langue, pays, thumbnail_url, embed_url, is_live) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [streamerId, streamerName, titre, jeu, categorie, nbViewers,
           langue, pays, thumbnailUrl, embedUrl, isLive]
        );

        return await StreamCache.findByStreamerId(streamerId);
      }
    } catch (error) {
      throw new Error(`Erreur upsert stream: ${error.message}`);
    }
  }

  // Trouver par ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM stream_cache WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new StreamCache(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erreur recherche stream: ${error.message}`);
    }
  }

  // Trouver par Streamer ID
  static async findByStreamerId(streamerId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM stream_cache WHERE streamer_id = ?',
        [streamerId]
      );
      
      return rows.length > 0 ? new StreamCache(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erreur recherche stream par streamer ID: ${error.message}`);
    }
  }

  // Recherche avec filtres
  static async searchWithFilters(filters = {}) {
    let query = 'SELECT * FROM stream_cache WHERE is_live = true';
    const params = [];

    // Ajouter les filtres
    if (filters.jeu) {
      query += ' AND jeu LIKE ?';
      params.push(`%${filters.jeu}%`);
    }

    if (filters.categorie) {
      query += ' AND categorie LIKE ?';
      params.push(`%${filters.categorie}%`);
    }

    if (filters.pays) {
      query += ' AND pays = ?';
      params.push(filters.pays);
    }

    if (filters.langue) {
      query += ' AND langue = ?';
      params.push(filters.langue);
    }

    if (filters.nbViewersMin) {
      query += ' AND nb_viewers >= ?';
      params.push(filters.nbViewersMin);
    }

    if (filters.nbViewersMax) {
      query += ' AND nb_viewers <= ?';
      params.push(filters.nbViewersMax);
    }

    // Ordre aléatoire pour la découverte
    query += ' ORDER BY RAND()';

    // Limite pour les performances
    const limit = filters.limit || 50;
    query += ' LIMIT ?';
    params.push(limit);

    try {
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new StreamCache(row));
    } catch (error) {
      throw new Error(`Erreur recherche streams filtrés: ${error.message}`);
    }
  }

  // Obtenir un stream aléatoire
  static async getRandomStream(filters = {}) {
    const streams = await StreamCache.searchWithFilters({
      ...filters,
      limit: 1
    });

    return streams.length > 0 ? streams[0] : null;
  }

  // Marquer tous les streams comme hors ligne
  static async markAllOffline() {
    try {
      await pool.execute('UPDATE stream_cache SET is_live = false');
      return true;
    } catch (error) {
      throw new Error(`Erreur mise hors ligne: ${error.message}`);
    }
  }

  // Supprimer les anciens streams (plus de 24h)
  static async cleanOldStreams() {
    try {
      await pool.execute(
        `DELETE FROM stream_cache 
         WHERE date_mise_a_jour < DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND is_live = false`
      );
      return true;
    } catch (error) {
      throw new Error(`Erreur nettoyage streams: ${error.message}`);
    }
  }

  // Mettre à jour le statut live
  async updateLiveStatus(isLive) {
    try {
      await pool.execute(
        'UPDATE stream_cache SET is_live = ?, date_mise_a_jour = NOW() WHERE id = ?',
        [isLive, this.id]
      );
      
      this.isLive = isLive;
      return this;
    } catch (error) {
      throw new Error(`Erreur mise à jour statut live: ${error.message}`);
    }
  }

  // Convertir en JSON
  toJSON() {
    return {
      id: this.id,
      streamerId: this.streamerId,
      streamerName: this.streamerName,
      titre: this.titre,
      jeu: this.jeu,
      categorie: this.categorie,
      nbViewers: this.nbViewers,
      langue: this.langue,
      pays: this.pays,
      thumbnailUrl: this.thumbnailUrl,
      embedUrl: this.embedUrl,
      dateMiseAJour: this.dateMiseAJour,
      isLive: this.isLive
    };
  }
}

module.exports = StreamCache;
