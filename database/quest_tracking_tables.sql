-- Table pour tracker les sessions de visionnage en temps réel
-- Cette table permet un suivi détaillé des sessions pour les quêtes de temps

CREATE TABLE viewing_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  streamer_id VARCHAR(100) NOT NULL,
  streamer_name VARCHAR(100) NOT NULL,
  game_category VARCHAR(100),
  viewer_count INT DEFAULT 0,
  session_start DATETIME NOT NULL,
  session_end DATETIME NULL,
  duration_minutes INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  ip_address VARCHAR(45), -- Pour éviter le spam
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
  INDEX idx_user_sessions (user_id, session_start),
  INDEX idx_active_sessions (is_active, session_start),
  INDEX idx_streamer_sessions (streamer_id, session_start)
);

-- Table pour tracker les actions spécifiques aux quêtes
-- Plus granulaire que user_quests pour un tracking détaillé

CREATE TABLE quest_actions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  action_type ENUM('stream_discovery', 'favorite_added', 'viewing_session', 'category_explored', 'time_threshold') NOT NULL,
  action_data JSON, -- Données spécifiques à l'action
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED, -- Pour les agrégations quotidiennes
  
  FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
  INDEX idx_user_actions (user_id, timestamp),
  INDEX idx_action_type (action_type, timestamp),
  INDEX idx_session_date (session_date, user_id)
);

-- Vues utiles pour les statistiques de quêtes

-- Vue pour les statistiques quotidiennes par utilisateur
CREATE VIEW daily_user_stats AS
SELECT 
  user_id,
  session_date,
  COUNT(CASE WHEN action_type = 'stream_discovery' THEN 1 END) as streams_discovered,
  COUNT(CASE WHEN action_type = 'favorite_added' THEN 1 END) as favorites_added,
  COUNT(CASE WHEN action_type = 'viewing_session' THEN 1 END) as viewing_sessions,
  SUM(CASE WHEN action_type = 'viewing_session' THEN JSON_EXTRACT(action_data, '$.duration') ELSE 0 END) as total_viewing_minutes
FROM quest_actions 
GROUP BY user_id, session_date;

-- Vue pour les catégories explorées par utilisateur
CREATE VIEW user_categories_explored AS
SELECT 
  user_id,
  JSON_EXTRACT(action_data, '$.game_category') as category,
  DATE(timestamp) as date_discovered,
  COUNT(*) as times_viewed
FROM quest_actions 
WHERE action_type = 'stream_discovery' 
  AND JSON_EXTRACT(action_data, '$.game_category') IS NOT NULL
GROUP BY user_id, JSON_EXTRACT(action_data, '$.game_category'), DATE(timestamp);
