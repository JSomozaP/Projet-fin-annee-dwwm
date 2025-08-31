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
    console.log('⚠️  Stripe non initialisé - clé de développement détectée');
  }
} catch (error) {
  console.error('❌ Erreur initialisation Stripe:', error.message);
}

// Configuration des plans d'abonnement
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    description: 'Accès de base à Streamyscovery',
    features: [
      'Accès à tous les niveaux 1-200',
      '6 quêtes quotidiennes',
      '4 quêtes hebdomadaires', 
      '3 quêtes mensuelles',
      'Interface standard'
    ],
    highlighted: false
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 5,
    currency: 'EUR',
    interval: 'month',
    description: 'Améliorez votre expérience de découverte',
    features: [
      'Boost XP +5%',
      '8 quêtes quotidiennes (+2)',
      'Quêtes premium exclusives',
      'Badge Premium exclusif',
      'Thèmes cosmétiques'
    ],
    highlighted: false
  },
  vip: {
    id: 'vip',
    name: 'VIP', 
    price: 9,
    currency: 'EUR',
    interval: 'month',
    description: 'Expérience VIP avec analytics personnelles',
    features: [
      'Boost XP +10%',
      '9 quêtes quotidiennes (+3)',
      '5 quêtes hebdomadaires (+1)',
      'Analytics personnelles',
      'Thèmes VIP exclusifs'
    ],
    highlighted: true,
    badge: 'POPULAIRE'
  },
  legendary: {
    id: 'legendary',
    name: 'Légendaire',
    price: 15,
    currency: 'EUR',
    interval: 'month',
    description: 'L\'expérience ultime de Streamyscovery',
    features: [
      'Boost XP +15%',
      '10 quêtes quotidiennes (+4)',
      '6 quêtes hebdomadaires (+2)',
      'Analytics avancées',
      'Support prioritaire',
      'Thèmes légendaires exclusifs'
    ],
    highlighted: false
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
 * Créer une session de checkout Stripe
 * POST /api/payments/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = 'f7be123d-6c57-11f0-8ddb-d415e749b7bc'; // ID pouikdev
    
    console.log(`🔄 Création session Stripe pour plan: ${planId}, user: ${userId}`);

    // Validation du plan
    if (!SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan d\'abonnement invalide' 
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planId];

    if (!stripe) {
      // Mode mock pour le développement si Stripe pas configuré
      return res.json({
        success: true,
        mock: true,
        message: 'Session créée en mode développement',
        plan: selectedPlan,
        user_id: userId,
        sessionId: 'mock_session_' + Date.now()
      });
    }

    // Création de la vraie session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Streamyscovery ${selectedPlan.name}`,
              description: selectedPlan.description,
              images: ['https://streamyscovery.com/logo.png'], // Remplacer par votre vraie URL
            },
            unit_amount: selectedPlan.price * 100, // Prix en centimes
            recurring: {
              interval: selectedPlan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/subscription/cancel`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planId: planId
      }
    });

    console.log('✅ Session Stripe créée:', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      plan: selectedPlan
    });

  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la session de paiement',
      error: error.message
    });
  }
});

/**
 * Webhook Stripe pour traiter les événements de paiement
 * POST /api/payments/webhook
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Vérifier la signature du webhook
    if (!stripe) {
      console.log('⚠️ Stripe non initialisé - webhook ignoré');
      return res.status(400).send('Stripe non configuré');
    }

    // Mode test local : accepter les requêtes sans signature si elles contiennent "test"
    const isLocalTest = req.body && JSON.stringify(req.body).includes('test_simulation');
    
    if (!endpointSecret || endpointSecret === 'whsec_placeholder_secret' || isLocalTest) {
      console.log('🧪 Mode test local - validation signature ignorée');
      // En mode développement, on peut traiter l'événement sans validation
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      // Validation de la signature en production
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }

    console.log(`🔔 Webhook reçu: ${event.type}`);

    // Traiter les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`⚠️ Événement non géré: ${event.type}`);
    }

    res.json({received: true});

  } catch (err) {
    console.error('❌ Erreur webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

/**
 * Gérer la completion d'une session de checkout
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('✅ Checkout session completed:', session.id);
    
    const userId = session.client_reference_id || session.metadata?.userId;
    const planId = session.metadata?.planId;
    
    if (!userId) {
      console.error('❌ User ID manquant dans les métadonnées');
      return;
    }

    // Mode test local - éviter les appels API Stripe
    if (session.id.includes('test_simulation')) {
      console.log('🧪 Mode test local détecté - simulation activation abonnement');
      
      // Simuler les données de subscription
      const mockSubscription = {
        id: session.subscription || 'sub_test_simulation',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // +30 jours
        plan: { id: planId }
      };
      
      await activateUserSubscription(userId, planId, mockSubscription);
      console.log(`🎉 Abonnement ${planId} activé pour l'utilisateur ${userId} (mode test)`);
      return;
    }

    // Récupérer les détails de la subscription en mode réel
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await activateUserSubscription(userId, planId, subscription);
    }

  } catch (error) {
    console.error('❌ Erreur checkout session completed:', error);
  }
}

/**
 * Gérer la création d'un abonnement
 */
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('✅ Subscription created:', subscription.id);
    // Logique de création d'abonnement
  } catch (error) {
    console.error('❌ Erreur subscription created:', error);
  }
}

/**
 * Gérer la mise à jour d'un abonnement
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 Subscription updated:', subscription.id);
    // Logique de mise à jour d'abonnement
  } catch (error) {
    console.error('❌ Erreur subscription updated:', error);
  }
}

/**
 * Gérer la suppression d'un abonnement
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('❌ Subscription deleted:', subscription.id);
    // Logique de suppression d'abonnement
    const userId = subscription.metadata?.userId;
    if (userId) {
      await deactivateUserSubscription(userId);
    }
  } catch (error) {
    console.error('❌ Erreur subscription deleted:', error);
  }
}

/**
 * Gérer un paiement réussi
 */
async function handlePaymentSucceeded(invoice) {
  try {
    console.log('💰 Payment succeeded:', invoice.id);
    // Logique de paiement réussi
  } catch (error) {
    console.error('❌ Erreur payment succeeded:', error);
  }
}

/**
 * Gérer un paiement échoué
 */
async function handlePaymentFailed(invoice) {
  try {
    console.log('💸 Payment failed:', invoice.id);
    // Logique de paiement échoué
  } catch (error) {
    console.error('❌ Erreur payment failed:', error);
  }
}

/**
 * Activer l'abonnement d'un utilisateur dans la base de données
 */
async function activateUserSubscription(userId, planId, subscription) {
  try {
    console.log(`🎯 Activation abonnement pour user ${userId}, plan ${planId}`);
    
    // Insérer ou mettre à jour dans la table subscriptions
    const query = `
      INSERT INTO subscriptions (
        user_id, 
        subscription_tier, 
        stripe_subscription_id, 
        status, 
        current_period_start, 
        current_period_end,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        subscription_tier = VALUES(subscription_tier),
        stripe_subscription_id = VALUES(stripe_subscription_id),
        status = VALUES(status),
        current_period_start = VALUES(current_period_start),
        current_period_end = VALUES(current_period_end),
        updated_at = NOW()
    `;
    
    const values = [
      userId,
      planId,
      subscription.id,
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000)
    ];
    
    await db.pool.query(query, values);
    
    // Mettre à jour le tier de l'utilisateur
    await updateUserTier(userId, planId);
    
    console.log(`✅ Abonnement activé pour user ${userId}`);
    
  } catch (error) {
    console.error('❌ Erreur activation abonnement:', error);
  }
}

/**
 * Désactiver l'abonnement d'un utilisateur
 */
async function deactivateUserSubscription(userId) {
  try {
    console.log(`🚫 Désactivation abonnement pour user ${userId}`);
    
    // Mettre à jour le statut dans la table subscriptions
    const query = `
      UPDATE subscriptions 
      SET status = 'canceled', updated_at = NOW() 
      WHERE user_id = ?
    `;
    
    await db.pool.query(query, [userId]);
    
    // Remettre l'utilisateur en tier gratuit
    await updateUserTier(userId, 'free');
    
    console.log(`✅ Abonnement désactivé pour user ${userId}`);
    
  } catch (error) {
    console.error('❌ Erreur désactivation abonnement:', error);
  }
}

/**
 * Mettre à jour le tier d'un utilisateur
 */
async function updateUserTier(userId, tier) {
  try {
    const query = `
      UPDATE utilisateur 
      SET subscription_tier = ?
      WHERE id = ?
    `;
    
    await db.pool.query(query, [tier, userId]);
    console.log(`✅ Tier mis à jour: ${userId} -> ${tier}`);
    
  } catch (error) {
    console.error('❌ Erreur mise à jour tier:', error);
  }
}

module.exports = router;