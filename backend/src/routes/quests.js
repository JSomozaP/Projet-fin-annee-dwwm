const express = require('express');
const questController = require('../controllers/questController');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes publiques (pour test sans auth)
router.get('/', questController.getUserQuests);
router.get('/daily', questController.getDailyQuests);
router.get('/progression', questController.getUserProgression);
router.post('/track-action', questController.trackAction);

// Routes admin
router.post('/initialize', questController.initializeQuests);
router.post('/complete/:questId', questController.completeQuest);

// Routes avec authentification (optionnelle pour l'instant)
// router.get('/', auth.optionalAuth, questController.getUserQuests);
// router.post('/track-action', auth.optionalAuth, questController.trackAction);

module.exports = router;
