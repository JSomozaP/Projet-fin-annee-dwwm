const { pool } = require('../config/database');

class UserQuest {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.questId = data.quest_id;
    this.progress = data.progress;
    this.isCompleted = data.is_completed;
    this.completedAt = data.completed_at;
    this.dateCreation = data.date_creation;
    this.dateModification = data.date_modification;
  }

  // Créer une nouvelle progression de quête
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      const id = require('crypto').randomUUID();
      const [result] = await connection.execute(
        `INSERT INTO user_quests (id, user_id, quest_id, progress, is_completed) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          data.userId,
          data.questId,
          data.progress || 0,
          data.isCompleted || false
        ]
      );

      return await UserQuest.findById(id);
    } finally {
      connection.release();
    }
  }

  // Trouver par ID
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user_quests WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new UserQuest(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  // Trouver une progression spécifique
  static async findOne(options) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM user_quests WHERE 1=1';
      let params = [];
      
      if (options.where) {
        if (options.where.userId) {
          query += ' AND user_id = ?';
          params.push(options.where.userId);
        }
        if (options.where.questId) {
          query += ' AND quest_id = ?';
          params.push(options.where.questId);
        }
      }
      
      const [rows] = await connection.execute(query, params);
      return rows.length > 0 ? new UserQuest(rows[0]) : null;
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
      
      if (data.progress !== undefined) {
        updates.push('progress = ?');
        params.push(data.progress);
      }
      if (data.isCompleted !== undefined) {
        updates.push('is_completed = ?');
        params.push(data.isCompleted);
      }
      if (data.completedAt !== undefined) {
        updates.push('completed_at = ?');
        params.push(data.completedAt);
      }
      
      updates.push('date_modification = CURRENT_TIMESTAMP');
      params.push(this.id);
      
      const [result] = await connection.execute(
        `UPDATE user_quests SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Mettre à jour l'objet actuel
      Object.assign(this, data);
      
      return this;
    } finally {
      connection.release();
    }
  }

  // Supprimer des progressions (pour reset)
  static async destroy(options) {
    const connection = await pool.getConnection();
    try {
      if (options.include && options.where) {
        // Pour les jointures avec Quest (simulation du reset par type)
        let query = `DELETE uq FROM user_quests uq 
                     JOIN quests q ON uq.quest_id = q.id 
                     WHERE q.type = ?`;
        let params = [];
        
        if (options.where['$Quest.type$']) {
          params.push(options.where['$Quest.type$']);
        }
        
        const [result] = await connection.execute(query, params);
        return result.affectedRows;
      }
    } finally {
      connection.release();
    }
  }

  // Méthode d'instance pour convertir en JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      questId: this.questId,
      progress: this.progress,
      isCompleted: this.isCompleted,
      completedAt: this.completedAt,
      dateCreation: this.dateCreation,
      dateModification: this.dateModification
    };
  }
}

module.exports = UserQuest;
