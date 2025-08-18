const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Initialisation Stripe conditionnelle
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder_remplacer_par_vraie_cle') {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialisé avec succès');
  } else {
    console.log('⚠️ Stripe non initialisé - clés placeholder détectées');
  }
} catch (error) {
  console.log('⚠️ Stripe non disponible:', error.message);
}

// Configuration des plans d'abonnement
const SUBSCRIPTION_PLANS = {
  premium: {
    name: 'Premium',
    price: 5,
    features: ['xp_boost_5', 'extra_quests_2', 'premium_themes']
  },
  vip: {
    name: 'VIP', 
    price: 9,
    features: ['xp_boost_10', 'extra_quests_3', 'analytics_personal', 'vip_themes']
  },
  legendary: {
    name: 'Légendaire',
    price: 15,
    features: ['xp_boost_15', 'extra_quests_4', 'analytics_advanced', 'priority_support', 'legendary_themes']
  }
};

/**
 * Obtenir la liste des plans disponibles
 * GET /api/payments/plans
 */
router.get('/plans', (req, res) => {
  try {
    res.json({
      success: true,
      plans: SUBSCRIPTION_PLANS
    });
  } catch (error) {
    console.error('❌ Erreur récupération plans:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des plans' 
    });
  }
});

/**
 * Obtenir le statut d'abonnement d'un utilisateur
 * GET /api/payments/subscription-status
 */
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Pour l'instant, retourner un statut par défaut
    res.json({
      success: true,
      subscription: {
        tier: 'free',
        status: 'active',
        current_period_end: null,
        features: []
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération statut:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du statut d\'abonnement' 
    });
  }
});

/**
 * Route de test pour vérifier que l'API fonctionne
 * GET /api/payments/test
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Payments fonctionne !',
    timestamp: new Date().toISOString(),
    stripe_available: !!stripe
  });
});

/**
 * Créer une session de checkout Stripe (mock pour le moment)
 * POST /api/payments/create-checkout-session
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.userId;

    // Validation du plan
    if (!SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan d\'abonnement invalide' 
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];

    if (!stripe) {
      // Mode mock pour le développement
      return res.json({
        success: true,
        mock: true,
        message: 'Session créée en mode développement',
        plan: selectedPlan,
        user_id: userId,
        session_id: 'mock_session_' + Date.now()
      });
    }

    // TODO: Implémentation Stripe réelle quand les clés seront configurées
    res.json({
      success: true,
      message: 'Stripe configuré mais session non implémentée',
      plan: selectedPlan
    });

  } catch (error) {
    console.error('❌ Erreur création session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la session de paiement' 
    });
  }
});

module.exports = router;