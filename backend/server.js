const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// IMPORTANT : Webhook Stripe doit être configuré AVANT express.json()
// pour recevoir le raw body nécessaire à la validation des signatures
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test de la connexion à la base de données au démarrage
testConnection();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Streamyscovery API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      streams: '/api/streams',
      favorites: '/api/favorites',
      quests: '/api/quests',
      payments: '/api/payments',
      randomStream: '/api/streams/random',
      searchGame: '/api/streams/search-game',
      discover: '/api/streams/discover'
    }
  });
});

// Routes API
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/streams', require('./src/routes/streams'));
app.use('/api/favorites', require('./src/routes/favorites'));
app.use('/api/quests', require('./src/routes/quests'));
app.use('/api/payments', require('./src/routes/payments'));

// TODO: Ajouter d'autres routes
// app.use('/api/users', require('./src/routes/users'));

// Démarrage du serveur avec MySQL configuré
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/twitch`);
  console.log(`🎮 Random stream: http://localhost:${PORT}/api/streams/random`);
});

module.exports = app;
