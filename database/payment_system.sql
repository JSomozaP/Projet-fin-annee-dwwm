-- ============================================================================
-- SYSTÈME DE PAIEMENT STREAMYSCOVERY - Tables MySQL
-- Date: 14 août 2025
-- ============================================================================

USE streamyscovery;

-- Table des abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    subscription_tier ENUM('free', 'premium', 'vip', 'legendary') NOT NULL DEFAULT 'free',
    stripe_subscription_id VARCHAR(255) NULL,
    paypal_subscription_id VARCHAR(255) NULL,
    payment_method ENUM('stripe', 'paypal') NULL,
    status ENUM('active', 'cancelled', 'expired', 'pending', 'failed') NOT NULL DEFAULT 'active',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    billing_cycle ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
    current_period_start DATETIME NULL,
    current_period_end DATETIME NULL,
    trial_end DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at DATETIME NULL,
    
    FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    INDEX idx_user_subscription (user_id),
    INDEX idx_stripe_subscription (stripe_subscription_id),
    INDEX idx_paypal_subscription (paypal_subscription_id),
    INDEX idx_subscription_status (status)
);

-- Table des paiements/transactions
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    stripe_payment_intent_id VARCHAR(255) NULL,
    paypal_payment_id VARCHAR(255) NULL,
    payment_method ENUM('stripe', 'paypal') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status ENUM('pending', 'succeeded', 'failed', 'cancelled', 'refunded') NOT NULL,
    failure_reason TEXT NULL,
    payment_date DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    INDEX idx_user_payments (user_id),
    INDEX idx_subscription_payments (subscription_id),
    INDEX idx_payment_status (status),
    INDEX idx_payment_date (payment_date)
);

-- Table des fonctionnalités premium
CREATE TABLE IF NOT EXISTS premium_features (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    feature_name VARCHAR(100) NOT NULL UNIQUE,
    feature_description TEXT NULL,
    required_tier ENUM('free', 'premium', 'vip', 'legendary') NOT NULL,
    feature_type ENUM('quest_access', 'xp_boost', 'level_access', 'analytics', 'support', 'badge', 'other') NOT NULL,
    feature_value JSON NULL, -- Stockage flexible pour valeurs spécifiques (ex: boost %, niveau max, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_feature_tier (required_tier),
    INDEX idx_feature_type (feature_type)
);

-- Table des webhooks (pour traçabilité)
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    webhook_id VARCHAR(255) NOT NULL,
    provider ENUM('stripe', 'paypal') NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSON NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    
    INDEX idx_webhook_provider (provider),
    INDEX idx_webhook_processed (processed),
    INDEX idx_webhook_received (received_at)
);

-- Ajout d'une colonne subscription_tier à la table utilisateur si elle n'existe pas
ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS subscription_tier ENUM('free', 'premium', 'vip', 'legendary') DEFAULT 'free' AFTER preferences;

-- ============================================================================
-- INSERTION DES FONCTIONNALITÉS PREMIUM PAR DÉFAUT
-- ============================================================================

INSERT INTO premium_features (feature_name, feature_description, required_tier, feature_type, feature_value) VALUES
-- Fonctionnalités Premium (5€/mois)
('xp_boost_premium', 'Boost XP +25%', 'premium', 'xp_boost', JSON_OBJECT('boost_percentage', 25)),
('level_access_premium', 'Accès aux niveaux 101-125', 'premium', 'level_access', JSON_OBJECT('max_level', 125)),
('premium_quests', 'Accès aux quêtes premium', 'premium', 'quest_access', JSON_OBJECT('quest_pool', 'premium')),
('premium_badge', 'Badge Premium exclusif', 'premium', 'badge', JSON_OBJECT('badge_name', 'Premium Member')),

-- Fonctionnalités VIP (9€/mois)
('xp_boost_vip', 'Boost XP +50%', 'vip', 'xp_boost', JSON_OBJECT('boost_percentage', 50)),
('level_access_vip', 'Accès aux niveaux 101-150', 'vip', 'level_access', JSON_OBJECT('max_level', 150)),
('vip_quests', 'Accès aux quêtes VIP', 'vip', 'quest_access', JSON_OBJECT('quest_pool', 'vip')),
('analytics_basic', 'Analytics de base', 'vip', 'analytics', JSON_OBJECT('analytics_level', 'basic')),
('vip_badge', 'Badge VIP exclusif', 'vip', 'badge', JSON_OBJECT('badge_name', 'VIP Member')),

-- Fonctionnalités Légendaires (15€/mois)
('xp_boost_legendary', 'Boost XP +100%', 'legendary', 'xp_boost', JSON_OBJECT('boost_percentage', 100)),
('level_access_legendary', 'Accès aux niveaux 101-200', 'legendary', 'level_access', JSON_OBJECT('max_level', 200)),
('legendary_quests', 'Accès aux quêtes légendaires', 'legendary', 'quest_access', JSON_OBJECT('quest_pool', 'legendary')),
('analytics_advanced', 'Analytics avancées', 'legendary', 'analytics', JSON_OBJECT('analytics_level', 'advanced')),
('priority_support', 'Support prioritaire', 'legendary', 'support', JSON_OBJECT('response_time', '24h')),
('legendary_badge', 'Badge Légendaire exclusif', 'legendary', 'badge', JSON_OBJECT('badge_name', 'Legendary Member')),
('exclusive_titles', 'Titres exclusifs légendaires', 'legendary', 'other', JSON_OBJECT('titles', JSON_ARRAY('Seigneur Légendaire', 'Maître Suprême')));

-- ============================================================================
-- INDEX ET OPTIMISATIONS
-- ============================================================================

-- Index composites pour requêtes fréquentes
CREATE INDEX idx_user_tier_status ON subscriptions(user_id, subscription_tier, status);
CREATE INDEX idx_payment_method_status ON payments(payment_method, status, payment_date);

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue pour obtenir rapidement le statut d'abonnement actuel d'un utilisateur
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COALESCE(s.subscription_tier, 'free') as current_tier,
    s.status as subscription_status,
    s.payment_method,
    s.current_period_end,
    s.billing_cycle,
    s.amount,
    CASE 
        WHEN s.current_period_end > NOW() THEN TRUE 
        ELSE FALSE 
    END as is_subscription_active
FROM utilisateur u
LEFT JOIN subscriptions s ON u.id = s.user_id 
    AND s.status = 'active' 
    AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

-- Vue pour les statistiques de revenus
CREATE OR REPLACE VIEW revenue_stats AS
SELECT 
    DATE(p.payment_date) as payment_day,
    s.subscription_tier,
    p.payment_method,
    COUNT(*) as transaction_count,
    SUM(p.amount) as daily_revenue,
    AVG(p.amount) as avg_transaction_amount
FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id
WHERE p.status = 'succeeded'
    AND p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(p.payment_date), s.subscription_tier, p.payment_method
ORDER BY payment_day DESC;

-- ============================================================================
-- TRIGGERS POUR AUTOMATISATION
-- ============================================================================

-- Trigger pour mettre à jour subscription_tier dans utilisateur quand subscription change
DELIMITER //
CREATE TRIGGER update_user_tier_on_subscription_change
    AFTER UPDATE ON subscriptions
    FOR EACH ROW
BEGIN
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        UPDATE utilisateur 
        SET subscription_tier = NEW.subscription_tier 
        WHERE id = NEW.user_id;
    ELSEIF NEW.status != 'active' AND OLD.status = 'active' THEN
        UPDATE utilisateur 
        SET subscription_tier = 'free' 
        WHERE id = NEW.user_id;
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- INSERTION DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Vous pouvez décommenter ces lignes pour des données de test
/*
INSERT INTO subscriptions (user_id, subscription_tier, payment_method, status, amount, currency, billing_cycle, current_period_start, current_period_end)
SELECT 
    id, 
    'premium', 
    'stripe', 
    'active', 
    5.00, 
    'EUR', 
    'monthly',
    NOW(),
    DATE_ADD(NOW(), INTERVAL 1 MONTH)
FROM utilisateur 
LIMIT 1;
*/

-- ============================================================================
-- COMMANDES UTILES
-- ============================================================================

-- Pour vérifier l'état des tables:
-- SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'streamyscovery' AND TABLE_NAME LIKE '%payment%' OR TABLE_NAME LIKE '%subscription%';

-- Pour vérifier les abonnements actifs:
-- SELECT * FROM user_subscription_status WHERE is_subscription_active = TRUE;

-- Pour voir les revenus des 30 derniers jours:
-- SELECT * FROM revenue_stats ORDER BY payment_day DESC LIMIT 30;
