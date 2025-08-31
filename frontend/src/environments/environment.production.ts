export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  
  // Stripe Configuration (placeholders for GitHub)
  stripePublishableKey: 'pk_test_VOTRE_CLE_PUBLIQUE_STRIPE_ICI',
  
  // Rate Limiting
  apiRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limite par window
  },
  
  // Debug/Development
  enableConsoleLogging: true,
  enableTestFeatures: true,
  
  // Analytics
  enableAnalytics: true,
  
  // Feature Flags
  features: {
    premiumAnalytics: true,
    stripePayments: true,
    webhookValidation: true,
    questTracking: true
  }
};
