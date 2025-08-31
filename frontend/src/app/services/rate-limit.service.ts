import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { MonitoringService } from './monitoring.service';

interface RateLimitRule {
  key: string;
  limit: number; // requests per window
  window: number; // window in milliseconds
  requests: number[];
}

@Injectable({
  providedIn: 'root'
})
export class RateLimitService {
  private rules: Map<string, RateLimitRule> = new Map();

  constructor(
    private configService: ConfigService,
    private monitoringService: MonitoringService
  ) {
    this.initializeRules();
  }

  private initializeRules() {
    const limits = this.configService.getRateLimits();
    
    // API rate limiting
    this.addRule('api_calls', limits.api, 60000); // per minute
    
    // Stripe rate limiting
    this.addRule('stripe_calls', limits.stripe, 60000); // per minute
    
    // Twitch API rate limiting
    this.addRule('twitch_calls', limits.twitch, 60000); // per minute
    
    // User actions rate limiting
    this.addRule('user_favorites', 20, 60000); // 20 favorites per minute
    this.addRule('user_quests', 10, 60000); // 10 quest actions per minute
    this.addRule('user_premium', 5, 300000); // 5 premium actions per 5 minutes
  }

  addRule(key: string, limit: number, windowMs: number) {
    this.rules.set(key, {
      key,
      limit,
      window: windowMs,
      requests: []
    });
  }

  /**
   * Vérifie si une action est autorisée selon les règles de rate limiting
   */
  isAllowed(key: string, userId?: string): boolean {
    const fullKey = userId ? `${key}_${userId}` : key;
    const rule = this.rules.get(key);
    
    if (!rule) {
      // Si pas de règle définie, autoriser
      return true;
    }

    const now = Date.now();
    const windowStart = now - rule.window;

    // Nettoyer les anciennes requêtes
    rule.requests = rule.requests.filter(timestamp => timestamp > windowStart);

    // Vérifier si la limite est atteinte
    if (rule.requests.length >= rule.limit) {
      // Log de l'erreur de rate limiting
      this.monitoringService.logError({
        type: 'api',
        message: `Rate limit exceeded for ${key}`,
        context: {
          key: fullKey,
          limit: rule.limit,
          window: rule.window,
          currentRequests: rule.requests.length
        },
        timestamp: new Date(),
        userId
      });

      return false;
    }

    // Enregistrer la nouvelle requête
    rule.requests.push(now);
    return true;
  }

  /**
   * Obtenir le statut de rate limiting pour une clé
   */
  getStatus(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const rule = this.rules.get(key);
    
    if (!rule) {
      return { allowed: true, remaining: -1, resetTime: 0 };
    }

    const now = Date.now();
    const windowStart = now - rule.window;
    
    // Nettoyer les anciennes requêtes
    rule.requests = rule.requests.filter(timestamp => timestamp > windowStart);
    
    const remaining = Math.max(0, rule.limit - rule.requests.length);
    const resetTime = rule.requests.length > 0 ? 
      Math.min(...rule.requests) + rule.window : now;

    return {
      allowed: remaining > 0,
      remaining,
      resetTime
    };
  }

  /**
   * Obtenir tous les statuts de rate limiting
   */
  getAllStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    
    for (const [key, rule] of this.rules) {
      statuses[key] = {
        ...this.getStatus(key),
        limit: rule.limit,
        window: rule.window
      };
    }
    
    return statuses;
  }

  /**
   * Réinitialiser les compteurs pour une clé (utile pour les tests)
   */
  reset(key: string) {
    const rule = this.rules.get(key);
    if (rule) {
      rule.requests = [];
    }
  }

  /**
   * Réinitialiser tous les compteurs
   */
  resetAll() {
    for (const rule of this.rules.values()) {
      rule.requests = [];
    }
  }

  /**
   * Middleware pour les requêtes HTTP
   */
  checkApiLimit(endpoint: string, userId?: string): boolean {
    // Règles spécifiques par endpoint
    const endpointRules: Record<string, string> = {
      '/api/streams': 'api_calls',
      '/api/favorites': 'user_favorites',
      '/api/quests': 'user_quests',
      '/api/payments': 'stripe_calls',
      '/api/premium': 'user_premium'
    };

    const ruleKey = endpointRules[endpoint] || 'api_calls';
    return this.isAllowed(ruleKey, userId);
  }

  /**
   * Obtenir les statistiques de rate limiting
   */
  getStatistics() {
    const stats = {
      totalRules: this.rules.size,
      activeRules: 0,
      totalRequests: 0,
      blockedRequests: 0
    };

    for (const rule of this.rules.values()) {
      if (rule.requests.length > 0) {
        stats.activeRules++;
      }
      stats.totalRequests += rule.requests.length;
    }

    return stats;
  }
}
