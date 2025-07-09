const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Changé le port par défaut

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Twitchscovery API is running!',
    version: '1.0.0',
    endpoints: {
      streams: '/api/streams',
      randomStream: '/api/streams/random',
      searchGame: '/api/streams/search-game'
    }
  });
});

// Routes API
app.use('/api/streams', require('./src/routes/streams'));

// TODO: Ajouter d'autres routes quand MySQL sera configuré
// app.use('/api/auth', require('./src/routes/auth'));
// app.use('/api/users', require('./src/routes/users'));
// app.use('/api/favorites', require('./src/routes/favorites'));

// Démarrage simplifié sans MySQL pour l'instant
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
  console.log(`🎮 Test random stream: http://localhost:${PORT}/api/streams/random`);
});

module.exports = app;
