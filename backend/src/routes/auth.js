const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// @route   GET /api/auth/twitch
// @desc    Initier l'authentification Twitch OAuth
// @access  Public
router.get('/twitch', AuthController.initiateAuth);

// @route   GET /api/auth/twitch/callback
// @desc    Callback après authentification Twitch
// @access  Public
router.get('/twitch/callback', AuthController.handleCallback);

// @route   POST /api/auth/logout
// @desc    Déconnecter l'utilisateur
// @access  Private
router.post('/logout', authenticateToken, AuthController.logout);

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// @route   GET /api/auth/verify
// @desc    Vérifier la validité du token JWT
// @access  Private
router.get('/verify', authenticateToken, AuthController.verifyToken);

module.exports = router;
