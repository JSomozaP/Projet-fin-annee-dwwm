const { pool } = require('../config/database');

class UserQuestProgress {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    
    // Compteurs pour les découvertes conditionnelles
    this.microStreamersDiscovered = data.microStreamersDiscovered || 0;
    this.smallStreamersDiscovered = data.smallStreamersDiscovered || 0;
    this.ultraMicroStreamersDiscovered = data.ultraMicroStreamersDiscovered || 0;
    this.largeStreamersDiscovered = data.largeStreamersDiscovered || 0;
    
    // Compteurs pour les favoris conditionnels
    this.microStreamersFavorited = data.microStreamersFavorited || 0;
    this.smallStreamersFavorited = data.smallStreamersFavorited || 0;
    this.ultraMicroStreamersFavorited = data.ultraMicroStreamersFavorited || 0;
    this.largeStreamersFavorited = data.largeStreamersFavorited || 0;
    
    // Compteurs pour les catégories et diversité
    this.categoriesDiscoveredJson = data.categoriesDiscoveredJson || '[]';
    this.uniqueCategoriesCount = data.uniqueCategoriesCount || 0;
    
    // Compteurs temporels (daily reset)
    this.dailyMicroStreamersDiscovered = data.dailyMicroStreamersDiscovered || 0;
    this.dailySmallStreamersDiscovered = data.dailySmallStreamersDiscovered || 0;
    this.dailyMicroStreamersFavorited = data.dailyMicroStreamersFavorited || 0;
    
    // Métadonnées de reset
    this.lastDailyReset = data.lastDailyReset;
    this.lastWeeklyReset = data.lastWeeklyReset;
    this.lastMonthlyReset = data.lastMonthlyReset;
    
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Getter pour les catégories en tant qu'array
  get categoriesDiscovered() {
    try {
      return JSON.parse(this.categoriesDiscoveredJson || '[]');
    } catch {
      return [];
    }
  }

  // Setter pour les catégories
  set categoriesDiscovered(value) {
    this.categoriesDiscoveredJson = JSON.stringify(value || []);
    this.uniqueCategoriesCount = (value || []).length;
  }

  // Créer un nouveau progrès de quête
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      const id = require('crypto').randomUUID();
      const [result] = await connection.execute(
        `INSERT INTO user_quest_progress (
          id, userId, microStreamersDiscovered, smallStreamersDiscovered, 
          ultraMicroStreamersDiscovered, largeStreamersDiscovered,
          microStreamersFavorited, smallStreamersFavorited, 
          ultraMicroStreamersFavorited, largeStreamersFavorited,
          categoriesDiscoveredJson, uniqueCategoriesCount,
          dailyMicroStreamersDiscovered, dailySmallStreamersDiscovered, dailyMicroStreamersFavorited,
          lastDailyReset, lastWeeklyReset, lastMonthlyReset
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.userId,
          data.microStreamersDiscovered || 0,
          data.smallStreamersDiscovered || 0,
          data.ultraMicroStreamersDiscovered || 0,
          data.largeStreamersDiscovered || 0,
          data.microStreamersFavorited || 0,
          data.smallStreamersFavorited || 0,
          data.ultraMicroStreamersFavorited || 0,
          data.largeStreamersFavorited || 0,
          data.categoriesDiscoveredJson || '[]',
          data.uniqueCategoriesCount || 0,
          data.dailyMicroStreamersDiscovered || 0,
          data.dailySmallStreamersDiscovered || 0,
          data.dailyMicroStreamersFavorited || 0,
          data.lastDailyReset || '1970-01-01',
          data.lastWeeklyReset || '1970-01-01',
          data.lastMonthlyReset || '1970-01-01'
        ]
      );

      return await UserQuestProgress.findById(id);
    } catch (error) {
      console.error('Erreur création UserQuestProgress:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Trouver par ID
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user_quest_progress WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new UserQuestProgress(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  // Trouver par userId
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user_quest_progress WHERE userId = ?',
        [userId]
      );
      
      return rows.length > 0 ? new UserQuestProgress(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  // Mettre à jour
  async update(updates) {
    const connection = await pool.getConnection();
    try {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await connection.execute(
        `UPDATE user_quest_progress SET ${setClause}, updatedAt = NOW() WHERE id = ?`,
        [...values, this.id]
      );

      // Recharger l'objet
      return await UserQuestProgress.findById(this.id);
    } finally {
      connection.release();
    }
  }

  // Reset des compteurs quotidiens
  static async resetDailyCounters(userId) {
    const progress = await this.findByUserId(userId);
    if (!progress) return null;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Reset seulement si on n'a pas déjà reset aujourd'hui
    if (progress.lastDailyReset !== today) {
      return await progress.update({
        dailyMicroStreamersDiscovered: 0,
        dailySmallStreamersDiscovered: 0,
        dailyMicroStreamersFavorited: 0,
        lastDailyReset: today
      });
    }
    
    return progress;
  }

  // Incrémenter un compteur
  static async incrementCounter(userId, counterName, value = 1) {
    let progress = await this.findByUserId(userId);
    
    if (!progress) {
      progress = await this.create({ userId });
    }
    
    const currentValue = progress[counterName] || 0;
    return await progress.update({ [counterName]: currentValue + value });
  }
}

module.exports = UserQuestProgress;
