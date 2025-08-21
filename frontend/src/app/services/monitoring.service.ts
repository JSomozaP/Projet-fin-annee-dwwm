import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ConfigService } from './config.service';

export interface ErrorReport {
  type: 'payment' | 'api' | 'quest' | 'premium' | 'general';
  message: string;
  context?: any;
  timestamp: Date;
  userId?: string;
  tier?: string;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private errorQueue: ErrorReport[] = [];
  private performanceMetrics: PerformanceMetric[] = [];

  constructor(private configService: ConfigService) {
    // Écouter les erreurs globales
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'general',
        message: event.message,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        timestamp: new Date()
      });
    });

    // Écouter les promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'general',
        message: 'Unhandled Promise Rejection',
        context: event.reason,
        timestamp: new Date()
      });
    });
  }

  /**
   * Logger une erreur
   */
  logError(error: ErrorReport): void {
    // Ajouter des infos contextuelles
    error.userId = this.getCurrentUserId();
    error.tier = this.getCurrentTier();

    this.errorQueue.push(error);

    // Log en console en dev
    if (this.configService.isDevelopment()) {
      console.error(`🚨 [${error.type.toUpperCase()}] ${error.message}`, error.context);
    }

    // En production, envoyer au service de monitoring
    if (this.configService.isProduction()) {
      this.sendErrorToService(error);
    }

    // Nettoyer la queue si elle devient trop grande
    const maxErrors = this.configService.getMaxErrorsInMemory();
    if (this.errorQueue.length > maxErrors) {
      this.errorQueue = this.errorQueue.slice(-Math.floor(maxErrors / 2));
    }
  }

  /**
   * Logger une métrique de performance
   */
  logPerformance(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric);

    if (this.configService.isDevelopment()) {
      const status = metric.success ? '✅' : '❌';
      console.log(`⚡ ${status} ${metric.name}: ${metric.duration}ms`);
    }

    // En production, envoyer au service d'analytics
    if (this.configService.isProduction()) {
      this.sendMetricToService(metric);
    }

    // Nettoyer les métriques anciennes
    if (this.performanceMetrics.length > 200) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  /**
   * Mesurer une opération
   */
  measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return operation()
      .then(result => {
        const duration = performance.now() - startTime;
        this.logPerformance({
          name,
          duration,
          timestamp: new Date(),
          success: true
        });
        return result;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        this.logPerformance({
          name,
          duration,
          timestamp: new Date(),
          success: false
        });
        
        // Logger l'erreur aussi
        this.logError({
          type: 'general',
          message: `Operation failed: ${name}`,
          context: error,
          timestamp: new Date()
        });
        
        throw error;
      });
  }

  /**
   * Logger spécifiquement les erreurs de paiement
   */
  logPaymentError(error: string, context?: any): void {
    this.logError({
      type: 'payment',
      message: error,
      context,
      timestamp: new Date()
    });
  }

  /**
   * Logger spécifiquement les erreurs d'API
   */
  logApiError(endpoint: string, error: any): void {
    this.logError({
      type: 'api',
      message: `API Error: ${endpoint}`,
      context: error,
      timestamp: new Date()
    });
  }

  /**
   * Logger spécifiquement les erreurs de quêtes
   */
  logQuestError(questId: string, error: string): void {
    this.logError({
      type: 'quest',
      message: `Quest Error: ${questId}`,
      context: error,
      timestamp: new Date()
    });
  }

  /**
   * Obtenir les erreurs récentes pour debug
   */
  getRecentErrors(): ErrorReport[] {
    return this.errorQueue.slice(-10);
  }

  /**
   * Obtenir les métriques de performance récentes
   */
  getRecentMetrics(): PerformanceMetric[] {
    return this.performanceMetrics.slice(-10);
  }

  /**
   * Obtenir un rapport de santé du système
   */
  getHealthReport(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    averagePerformance: number;
    successRate: number;
  } {
    const errorsByType: Record<string, number> = {};
    this.errorQueue.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    const recentMetrics = this.performanceMetrics.slice(-50);
    const avgPerformance = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
      : 0;

    const successCount = recentMetrics.filter(m => m.success).length;
    const successRate = recentMetrics.length > 0 ? (successCount / recentMetrics.length) * 100 : 100;

    return {
      totalErrors: this.errorQueue.length,
      errorsByType,
      averagePerformance: Math.round(avgPerformance),
      successRate: Math.round(successRate)
    };
  }

  private getCurrentUserId(): string | undefined {
    // TODO: Obtenir l'ID utilisateur depuis le service d'auth
    return localStorage.getItem('userId') || undefined;
  }

  private getCurrentTier(): string | undefined {
    return localStorage.getItem('userTier') || 'free';
  }

  private sendErrorToService(error: ErrorReport): void {
    // TODO: Implémenter l'envoi vers un service de monitoring externe
    // Ex: Sentry, LogRocket, etc.
    console.warn('Production error reporting not implemented yet');
  }

  private sendMetricToService(metric: PerformanceMetric): void {
    // TODO: Implémenter l'envoi vers un service d'analytics
    // Ex: Google Analytics, Mixpanel, etc.
  }
}
