import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AppConfig {
  production: boolean;
  apiUrl: string;
  twitchClientId: string;
  stripePublicKey: string;
  enableDebug: boolean;
  enableHealthPanel: boolean;
  enablePerformanceMonitoring: boolean;
  maxErrorsInMemory: number;
  healthCheckInterval: number;
  apiTimeout: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = {
      production: environment.production,
      apiUrl: environment.apiUrl,
      twitchClientId: environment.twitchClientId,
      stripePublicKey: environment.stripePublishableKey,
      
      // Debug & Monitoring settings
      enableDebug: !environment.production,
      enableHealthPanel: !environment.production,
      enablePerformanceMonitoring: true,
      
      // Memory limits
      maxErrorsInMemory: 50,
      
      // Intervals (ms)
      healthCheckInterval: 30000, // 30 seconds
      
      // Timeouts (ms)
      apiTimeout: 10000 // 10 seconds
    };

    // Override based on URL parameters in development
    if (!environment.production) {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('debug') === 'true') {
        this.config.enableDebug = true;
      }
      
      if (urlParams.get('health') === 'true') {
        this.config.enableHealthPanel = true;
      }
    }
  }

  get(): AppConfig {
    return { ...this.config };
  }

  isProduction(): boolean {
    return this.config.production;
  }

  isDevelopment(): boolean {
    return !this.config.production;
  }

  isDebugEnabled(): boolean {
    return this.config.enableDebug;
  }

  isHealthPanelEnabled(): boolean {
    return this.config.enableHealthPanel;
  }

  isPerformanceMonitoringEnabled(): boolean {
    return this.config.enablePerformanceMonitoring;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getStripePublicKey(): string {
    return this.config.stripePublicKey;
  }

  getMaxErrorsInMemory(): number {
    return this.config.maxErrorsInMemory;
  }

  getHealthCheckInterval(): number {
    return this.config.healthCheckInterval;
  }

  getApiTimeout(): number {
    return this.config.apiTimeout;
  }

  // Security check for admin features
  canAccessAdmin(): boolean {
    if (this.config.production) {
      // In production, check for specific admin authentication
      const adminToken = localStorage.getItem('admin_token');
      return adminToken === 'streamyscovery_admin_2025';
    }
    
    // In development, always allow
    return true;
  }

  // Rate limiting configuration
  getRateLimits() {
    return {
      api: this.config.production ? 100 : 1000, // requests per minute
      stripe: this.config.production ? 50 : 200, // requests per minute
      twitch: this.config.production ? 200 : 500 // requests per minute
    };
  }

  // Feature flags
  getFeatureFlags() {
    return {
      premiumAnalytics: true,
      questSystem: true,
      healthMonitoring: this.config.enableHealthPanel,
      performanceTracking: this.config.enablePerformanceMonitoring,
      errorReporting: true,
      autoSave: true,
      realTimeUpdates: !this.config.production // Disable in prod for now
    };
  }

  // CORS and security headers validation
  getSecurityConfig() {
    return {
      allowedOrigins: this.config.production 
        ? ['https://streamyscovery.com', 'https://www.streamyscovery.com']
        : ['http://localhost:4200', 'http://127.0.0.1:4200'],
      
      trustedDomains: [
        'api.twitch.tv',
        'id.twitch.tv',
        'js.stripe.com',
        'api.stripe.com'
      ],
      
      enforceHttps: this.config.production,
      enableCSP: this.config.production
    };
  }
}
