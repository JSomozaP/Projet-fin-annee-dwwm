-- Table pour stocker les progrès spécifiques des quêtes conditionnelles
CREATE TABLE IF NOT EXISTS user_quest_progress (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    
    -- Compteurs pour les découvertes conditionnelles
    microStreamersDiscovered INT DEFAULT 0,
    smallStreamersDiscovered INT DEFAULT 0,
    ultraMicroStreamersDiscovered INT DEFAULT 0,
    largeStreamersDiscovered INT DEFAULT 0,
    
    -- Compteurs pour les favoris conditionnels
    microStreamersFavorited INT DEFAULT 0,
    smallStreamersFavorited INT DEFAULT 0,
    ultraMicroStreamersFavorited INT DEFAULT 0,
    largeStreamersFavorited INT DEFAULT 0,
    
    -- Compteurs pour les catégories et diversité
    categoriesDiscoveredJson TEXT DEFAULT '[]', -- JSON array des catégories découvertes
    uniqueCategoriesCount INT DEFAULT 0,
    
    -- Compteurs temporels (daily reset)
    dailyMicroStreamersDiscovered INT DEFAULT 0,
    dailySmallStreamersDiscovered INT DEFAULT 0,
    dailyMicroStreamersFavorited INT DEFAULT 0,
    
    -- Métadonnées de reset
    lastDailyReset DATE DEFAULT '1970-01-01',
    lastWeeklyReset DATE DEFAULT '1970-01-01',
    lastMonthlyReset DATE DEFAULT '1970-01-01',
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_userId (userId),
    INDEX idx_lastReset (lastDailyReset, lastWeeklyReset, lastMonthlyReset),
    UNIQUE KEY unique_userId (userId)
);
