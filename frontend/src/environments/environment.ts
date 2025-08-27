// ⚠️ FICHIER AVEC VRAIES CLÉS - NE PAS COMMITTER ⚠️
// Ce fichier contient vos vraies clés API frontend. Utilisez-le en local uniquement.
// Renommez ce fichier en "environment.ts" pour l'utiliser en développement local.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  twitchClientId: '5kkozw5c0q8i3ve2pki9pf71zf4vri', // VRAIE CLÉ Twitch Client ID
  twitchRedirectUri: 'http://localhost:4201/auth/callback',
  stripePublishableKey: 'pk_test_51RyC3TBEhknh32zNMzveB1ePiCb5WyNfOPx03u4ZS2Ggr2AUkn5CtUhmCQHq4u7y6rjXt9IkAymTUx3zXbsh0gjB00kbgOp2Hv' // VRAIE CLÉ Stripe
};

// ========================================
// INSTRUCTIONS D'UTILISATION :
// ========================================
// 1. Renommez ce fichier en "environment.ts" dans src/environments/
// 2. Les vraies clés ci-dessus sont fonctionnelles pour le développement local
// 3. En production, utilisez de nouvelles clés sécurisées
// 4. Ne jamais committer les vraies clés sur GitHub !
