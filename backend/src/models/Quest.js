const { pool } = require('../config/database');

class Quest {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type; // 'daily', 'weekly', 'monthly', 'achievement'
    this.category = data.category;
    this.xpReward = data.xp_reward;
    this.badgeReward = data.badge_reward;
    this.requirement = data.requirement;
    this.conditions = typeof data.conditions === 'string' ? JSON.parse(data.conditions) : data.conditions;
    this.isActive = data.is_active;
    this.dateCreation = data.date_creation;
    this.dateModification = data.date_modification;
  }

  // Créer une nouvelle quête
  static async create(questData) {
    const connection = await pool.getConnection();
    try {
      const id = questData.id || require('crypto').randomUUID();
      const [result] = await connection.execute(
        `INSERT INTO quests (id, title, description, type, category, xp_reward, badge_reward, requirement, conditions, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          questData.title,
          questData.description,
          questData.type,
          questData.category,
          questData.xpReward || 0,
          questData.badgeReward || null,
          questData.requirement || 1,
          JSON.stringify(questData.conditions || {}),
          questData.isActive !== undefined ? questData.isActive : true
        ]
      );

      return await Quest.findById(id);
    } finally {
      connection.release();
    }
  }

  // Trouver une quête par ID
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM quests WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new Quest(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  // Trouver une quête par titre
  static async findOne(options) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM quests WHERE 1=1';
      let params = [];
      
      if (options.where) {
        if (options.where.title) {
          query += ' AND title = ?';
          params.push(options.where.title);
        }
        if (options.where.id) {
          query += ' AND id = ?';
          params.push(options.where.id);
        }
      }
      
      const [rows] = await connection.execute(query, params);
      return rows.length > 0 ? new Quest(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  // Trouver toutes les quêtes
  static async findAll(options = {}) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM quests';
      let params = [];
      
      if (options.where) {
        const conditions = [];
        if (options.where.isActive !== undefined) {
          conditions.push('is_active = ?');
          params.push(options.where.isActive);
        }
        if (options.where.type) {
          conditions.push('type = ?');
          params.push(options.where.type);
        }
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      const [rows] = await connection.execute(query, params);
      return rows.map(row => new Quest(row));
    } finally {
      connection.release();
    }
  }

  // Trouver ou créer une quête
  static async findOrCreate(whereClause, defaults) {
    const connection = await pool.getConnection();
    try {
      // Chercher d'abord la quête existante
      let quest = await Quest.findOne({ where: whereClause });

      if (quest) {
        return [quest, false]; // [quest, wasCreated]
      }

      // Créer la nouvelle quête
      quest = await Quest.create({ ...whereClause, ...defaults });
      return [quest, true];
    } finally {
      connection.release();
    }
  }

  // Méthode d'instance pour convertir en JSON
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      category: this.category,
      xpReward: this.xpReward,
      badgeReward: this.badgeReward,
      requirement: this.requirement,
      conditions: this.conditions,
      isActive: this.isActive,
      dateCreation: this.dateCreation,
      dateModification: this.dateModification
    };
  }
}

module.exports = Quest;
