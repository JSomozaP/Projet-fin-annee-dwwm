const { pool } = require('../config/database');

class UserProgression {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId; // Corrigé: utiliser camelCase
    this.level = data.level;
    this.totalXP = data.totalXP; // Corrigé: utiliser camelCase
    this.currentXP = data.currentXP; // Corrigé: utiliser camelCase
    this.nextLevelXP = data.nextLevelXP; // Corrigé: utiliser camelCase
    this.badges = data.badges ? (typeof data.badges === 'string' ? JSON.parse(data.badges) : data.badges) : [];
    this.titles = data.titles ? (typeof data.titles === 'string' ? JSON.parse(data.titles) : data.titles) : [];
    this.currentTitle = data.currentTitle; // Corrigé: utiliser camelCase
    this.streamsDiscovered = data.streamsDiscovered; // Corrigé: utiliser camelCase
    this.favoritesAdded = data.favoritesAdded; // Corrigé: utiliser camelCase
    this.questsCompleted = data.questsCompleted; // Corrigé: utiliser camelCase
    this.subscriptionBonus = data.subscriptionBonus; // Corrigé: utiliser camelCase
    this.dateCreation = data.createdAt; // Corrigé: utiliser le nom de colonne réel
    this.dateModification = data.updatedAt; // Corrigé: utiliser le nom de colonne réel
  }

  // Créer une nouvelle progression utilisateur
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      const id = require('crypto').randomUUID();
      const [result] = await connection.execute(
        `INSERT INTO user_progressions (id, userId, level, totalXP, currentXP, nextLevelXP, badges, titles, currentTitle, streamsDiscovered, totalWatchTime, raidsInitiated, sponsorshipsCreated, subscriptionTier) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.userId,
          data.level || 1,
          data.totalXP || 0,
          data.currentXP || 0,
          data.nextLevelXP || 1000,
          JSON.stringify(data.badges || []),
          JSON.stringify(data.titles || []),
          data.currentTitle || null,
          data.streamsDiscovered || 0,
          data.totalWatchTime || 0,
          data.raidsInitiated || 0,
          data.sponsorshipsCreated || 0,
          data.subscriptionTier || 'free'
        ]
      );

      return await UserProgression.findById(id);
    } finally {
      connection.release();
    }
  }

  // Trouver par ID
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user_progressions WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new UserProgression(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  // Trouver une progression spécifique
  static async findOne(options) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM user_progressions WHERE 1=1';
      let params = [];
      
      if (options.where) {
        if (options.where.userId) {
          query += ' AND userId = ?';
          params.push(options.where.userId);
        }
      }
      
      const [rows] = await connection.execute(query, params);
      return rows.length > 0 ? new UserProgression(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  // Mettre à jour la progression
  async update(data) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const params = [];
      
      if (data.level !== undefined) {
        updates.push('level = ?');
        params.push(data.level);
      }
      if (data.totalXP !== undefined) {
        updates.push('totalXP = ?');
        params.push(data.totalXP);
      }
      if (data.currentXP !== undefined) {
        updates.push('currentXP = ?');
        params.push(data.currentXP);
      }
      if (data.nextLevelXP !== undefined) {
        updates.push('nextLevelXP = ?');
        params.push(data.nextLevelXP);
      }
      if (data.badges !== undefined) {
        updates.push('badges = ?');
        params.push(JSON.stringify(data.badges));
      }
      if (data.titles !== undefined) {
        updates.push('titles = ?');
        params.push(JSON.stringify(data.titles));
      }
      if (data.currentTitle !== undefined) {
        updates.push('currentTitle = ?');
        params.push(data.currentTitle);
      }
      if (data.streamsDiscovered !== undefined) {
        updates.push('streamsDiscovered = ?');
        params.push(data.streamsDiscovered);
      }
      if (data.favoritesAdded !== undefined) {
        updates.push('favoritesAdded = ?');
        params.push(data.favoritesAdded);
      }
      if (data.totalWatchTime !== undefined) {
        updates.push('totalWatchTime = ?');
        params.push(data.totalWatchTime);
      }
      if (data.raidsInitiated !== undefined) {
        updates.push('raidsInitiated = ?');
        params.push(data.raidsInitiated);
      }
      if (data.sponsorshipsCreated !== undefined) {
        updates.push('sponsorshipsCreated = ?');
        params.push(data.sponsorshipsCreated);
      }
      if (data.subscriptionTier !== undefined) {
        updates.push('subscriptionTier = ?');
        params.push(data.subscriptionTier);
      }
      
      updates.push('updatedAt = CURRENT_TIMESTAMP');
      params.push(this.id);
      
      const [result] = await connection.execute(
        `UPDATE user_progressions SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Mettre à jour l'objet actuel
      Object.assign(this, data);
      
      return this;
    } finally {
      connection.release();
    }
  }

  // Méthode d'instance pour convertir en JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      level: this.level,
      totalXP: this.totalXP,
      currentXP: this.currentXP,
      nextLevelXP: this.nextLevelXP,
      badges: this.badges,
      titles: this.titles,
      currentTitle: this.currentTitle,
      streamsDiscovered: this.streamsDiscovered,
      favoritesAdded: this.favoritesAdded,
      questsCompleted: this.questsCompleted,
      subscriptionBonus: this.subscriptionBonus,
      dateCreation: this.dateCreation,
      dateModification: this.dateModification
    };
  }
}

module.exports = UserProgression;
