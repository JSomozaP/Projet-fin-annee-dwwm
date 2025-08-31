/**
 * Streamyscovery - Middleware d'authentification
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Ce middleware gère l'authentification JWT et la protection
 * des routes sécurisées de l'API.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'authentification requis' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier que l'utilisateur est toujours connecté
    if (!user.isConnected) {
      return res.status(401).json({ 
        error: 'Session expirée' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification:', error.message);
    return res.status(403).json({ 
      error: 'Token invalide' 
    });
  }
};

// Middleware d'authentification optionnelle
const optionalAuth = async (req, res, next) => {
  console.log('🔍 OptionalAuth middleware appelé pour:', req.method, req.path);
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('🔍 Token extrait:', token ? token.substring(0, 20) + '...' : 'Aucun');

  if (token) {
    try {
      console.log('🔓 Tentative de vérification du token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token décodé:', decoded);
      
      const user = await User.findById(decoded.userId);
      console.log('👤 Utilisateur trouvé:', user ? `${user.username} (ID: ${user.id})` : 'Aucun');
      
      if (user && user.isConnected) {
        req.user = user;
        console.log('✅ Utilisateur authentifié avec succès');
      } else {
        console.log('⚠️ Utilisateur non connecté ou introuvable');
      }
    } catch (error) {
      // Token invalide mais on continue sans user
      console.log('❌ Token optionnel invalide:', error.message);
    }
  } else {
    console.log('⚠️ Aucun token fourni');
  }
  
  next();
};

// Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      twitchId: user.twitchId,
      username: user.username 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d' // Token valide 7 jours
    }
  );
};

// Vérifier si l'utilisateur est admin (pour futures fonctionnalités)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  // Logique admin à implémenter selon les besoins
  const adminUsers = ['admin_twitch_id_1', 'admin_twitch_id_2'];
  
  if (!adminUsers.includes(req.user.twitchId)) {
    return res.status(403).json({ error: 'Accès admin requis' });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  requireAdmin
};
