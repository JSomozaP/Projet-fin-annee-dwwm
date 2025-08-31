const { User } = require('./src/models');
require('dotenv').config();

async function createTestUser() {
  try {
    console.log('Recherche ou création d\'un utilisateur de test...');
    
    // D'abord essayer de trouver un utilisateur existant
    let user = await User.findByEmail('test@example.com');
    
    if (!user) {
      const userData = {
        twitchId: 'test123_' + Date.now(),
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        twitchToken: 'test_token_123',
        preferences: {}
      };

      user = await User.create(userData);
      console.log('Utilisateur créé:', user);
    } else {
      console.log('Utilisateur existant trouvé:', user);
    }
    
    // Générer un token pour cet utilisateur
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user.id,
        twitchId: user.twitchId,
        username: user.username 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h'
      }
    );

    console.log('\n✅ Token pour les tests:');
    console.log(token);
    console.log('\n📋 Commande test favoris:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/favorites`);
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
  
  process.exit(0);
}

createTestUser();
