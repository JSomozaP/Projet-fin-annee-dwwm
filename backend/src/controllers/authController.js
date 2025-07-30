const { User } = require('../models');
const { generateToken } = require('../middleware/auth');

class AuthController {
  
  // Initier l'authentification Twitch OAuth
  static async initiateAuth(req, res) {
    try {
      // URL de redirection vers Twitch OAuth
      const clientId = process.env.TWITCH_CLIENT_ID;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/twitch/callback`;
      const scope = 'user:read:email'; // Permissions demandées
      
      const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${scope}`;

      res.json({ 
        authUrl: twitchAuthUrl,
        message: 'Redirection vers Twitch pour authentification'
      });
    } catch (error) {
      console.error('Erreur initiation auth:', error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'initiation de l\'authentification' 
      });
    }
  }

  // Callback après authentification Twitch
  static async handleCallback(req, res) {
    try {
      const { code, error } = req.query;

      if (error) {
        return res.status(400).json({ 
          error: `Erreur Twitch: ${error}` 
        });
      }

      if (!code) {
        return res.status(400).json({ 
          error: 'Code d\'autorisation manquant' 
        });
      }

      // Échanger le code contre un token d'accès
      const tokenData = await AuthController.exchangeCodeForToken(code, req);
      
      if (!tokenData.access_token) {
        return res.status(400).json({ 
          error: 'Impossible d\'obtenir le token d\'accès' 
        });
      }

      // Récupérer les informations utilisateur Twitch
      const twitchUser = await AuthController.getTwitchUserInfo(tokenData.access_token);
      
      if (!twitchUser) {
        return res.status(400).json({ 
          error: 'Impossible de récupérer les informations utilisateur' 
        });
      }

      // Créer ou mettre à jour l'utilisateur dans la base
      let user = await User.findByTwitchId(twitchUser.id);
      
      if (user) {
        // Utilisateur existant - mise à jour du token
        await user.updateTwitchToken(tokenData.access_token);
        await user.updateConnectionStatus(true);
      } else {
        // Nouvel utilisateur
        user = await User.create({
          email: twitchUser.email,
          username: twitchUser.display_name || twitchUser.login,
          twitchId: twitchUser.id,
          twitchToken: tokenData.access_token,
          preferences: {
            theme: 'dark',
            notifications: true,
            autoplay: true
          }
        });
      }

      // Générer le JWT pour l'application
      const jwtToken = generateToken(user);

      // Redirection vers le frontend avec le token
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' 
        : 'http://localhost:4201';
      
      res.redirect(`${frontendUrl}/auth/success?token=${jwtToken}`);

    } catch (error) {
      console.error('Erreur callback auth:', error);
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' 
        : 'http://localhost:4201';
      
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  // Échanger le code d'autorisation contre un token
  static async exchangeCodeForToken(code, req) {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/twitch/callback`
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur token exchange: ${response.status}`);
    }

    return await response.json();
  }

  // Récupérer les infos utilisateur Twitch
  static async getTwitchUserInfo(accessToken) {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur user info: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0]; // Retourner le premier (et seul) utilisateur
  }

  // Déconnexion
  static async logout(req, res) {
    try {
      if (req.user) {
        await req.user.updateConnectionStatus(false);
      }

      res.json({ 
        message: 'Déconnexion réussie' 
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la déconnexion' 
      });
    }
  }

  // Obtenir les informations de l'utilisateur connecté
  static async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Non authentifié' 
        });
      }

      res.json({
        user: req.user.toJSON()
      });
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des informations utilisateur' 
      });
    }
  }

  // Vérifier la validité du token
  static async verifyToken(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Token invalide' 
        });
      }

      res.json({
        valid: true,
        user: req.user.toJSON()
      });
    } catch (error) {
      console.error('Erreur vérification token:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la vérification du token' 
      });
    }
  }
}

module.exports = AuthController;
