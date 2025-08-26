const express = require('express');
const questController = require('../controllers/questController');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes avec authentification optionnelle
router.get('/', auth.optionalAuth, questController.getUserQuests);
router.get('/daily', auth.optionalAuth, questController.getDailyQuests);
router.get('/progression', auth.optionalAuth, questController.getUserProgression);
router.post('/track-action', auth.optionalAuth, questController.trackAction);

// Routes admin
router.post('/initialize', questController.initializeQuests);
router.post('/complete/:questId', questController.completeQuest);

module.exports = router;
