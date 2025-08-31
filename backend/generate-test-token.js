const jwt = require('jsonwebtoken');
require('dotenv').config();

// Créer un token pour l'utilisateur pouikdev
const userPayload = {
  id: 'f7be123d-6c57-11f0-8ddb-d415e749b7bc',
  userId: 'f7be123d-6c57-11f0-8ddb-d415e749b7bc',
  username: 'pouikdev',
  email: 'jeremy.somoza@laplateforme.io'
};

const token = jwt.sign(userPayload, process.env.JWT_SECRET || 'default-secret', { expiresIn: '24h' });

console.log('🔑 Token de test pour pouikdev:');
console.log(token);
console.log('\n📋 Commande test quêtes:');
console.log(`curl -H "Authorization: Bearer ${token}" "http://localhost:3000/api/quests"`);
console.log('\n📋 Commande test stream aléatoire (pour tracking):');
console.log(`curl -H "Authorization: Bearer ${token}" "http://localhost:3000/api/streams/random"`);
