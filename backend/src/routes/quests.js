const express = require('express');
const questController = require('../controllers/questController');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes avec authentification optionnelle
router.get('/', auth.optionalAuth, questController.getUserQuests);
router.get('/daily', auth.optionalAuth, questController.getDailyQuests);
router.get('/progression', auth.optionalAuth, questController.getUserProgression);
router.get('/progress', auth.optionalAuth, questController.getQuestProgressData);
router.get('/progress-data', auth.optionalAuth, questController.getProgressData);
router.post('/track-action', auth.optionalAuth, questController.trackAction);
router.post('/recalculate-level', auth.optionalAuth, questController.recalculateLevel);

// Routes admin
router.post('/initialize', questController.initializeQuests);
router.post('/complete/:questId', questController.completeQuest);

module.exports = router;
