/**
 * Streamyscovery - Configuration de base de données
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Ce fichier gère la configuration et la connexion à la base de données MySQL
 * avec pool de connexions pour optimiser les performances.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'streamyscovery',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à MySQL réussie !');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
