const jwt = require('jsonwebtoken');
require('dotenv').config();

// Simuler un utilisateur test existant
const testUser = {
  id: 1,
  twitchId: 'pouikdev',
  username: 'pouikdev'
};

// Générer un token JWT
const token = jwt.sign(
  { 
    userId: testUser.id,
    twitchId: testUser.twitchId,
    username: testUser.username 
  },
  process.env.JWT_SECRET,
  { 
    expiresIn: '1h'
  }
);

console.log('Token JWT pour tests:', token);
console.log('\nUtilisation:');
console.log('curl -H "Authorization: Bearer ' + token + '" http://localhost:3000/api/favorites');
