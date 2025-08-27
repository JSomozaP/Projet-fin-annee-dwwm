const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

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
    logger.error('Erreur authentification:', error.message);
    return res.status(403).json({ 
      error: 'Token invalide' 
    });
  }
};

// Middleware optionnel (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isConnected) {
        req.user = user;
      }
    } catch (error) {
      // Token invalide mais on continue sans user
      // Logs supprimés pour éviter le spam
    }
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
