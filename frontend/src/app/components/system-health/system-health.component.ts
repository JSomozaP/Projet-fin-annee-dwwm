import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoringService } from '../../services/monitoring.service';
import { PremiumService } from '../../services/premium.service';
import { ConfigService } from '../../services/config.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-container" *ngIf="showDebugPanel">
      <div class="health-header">
        <h2>🏥 Système de Santé Streamyscovery</h2>
        <button class="close-btn" (click)="hidePanel()">✕</button>
      </div>

      <!-- System Overview -->
      <div class="health-section">
        <h3>📊 Vue d'ensemble</h3>
        <div class="stats-grid">
          <div class="stat-item" [class.stat-error]="healthReport.totalErrors > 5">
            <strong>{{ healthReport.totalErrors }}</strong>
            <span>Erreurs totales</span>
          </div>
          <div class="stat-item" [class.stat-success]="healthReport.successRate > 95">
            <strong>{{ healthReport.successRate }}%</strong>
            <span>Taux de succès</span>
          </div>
          <div class="stat-item">
            <strong>{{ healthReport.averagePerformance }}ms</strong>
            <span>Performance moyenne</span>
          </div>
          <div class="stat-item">
            <strong>{{ currentTier.displayName }}</strong>
            <span>Tier actuel</span>
          </div>
        </div>
      </div>

      <!-- Errors by Type -->
      <div class="health-section" *ngIf="Object.keys(healthReport.errorsByType).length > 0">
        <h3>🚨 Erreurs par Type</h3>
        <div class="error-types">
          <div 
            *ngFor="let error of getErrorEntries()" 
            class="error-type-item"
            [class.error-critical]="error.count > 3"
          >
            <span class="error-badge">{{ getErrorIcon(error.type) }}</span>
            <span class="error-name">{{ error.type }}</span>
            <span class="error-count">{{ error.count }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Errors -->
      <div class="health-section" *ngIf="recentErrors.length > 0">
        <h3>🔍 Erreurs Récentes</h3>
        <div class="recent-errors">
          <div *ngFor="let error of recentErrors" class="error-item">
            <div class="error-header">
              <span class="error-type-badge" [class]="'badge-' + error.type">{{ error.type }}</span>
              <span class="error-time">{{ formatTime(error.timestamp) }}</span>
            </div>
            <div class="error-message">{{ error.message }}</div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="health-section" *ngIf="recentMetrics.length > 0">
        <h3>⚡ Métriques Récentes</h3>
        <div class="metrics-list">
          <div *ngFor="let metric of recentMetrics" class="metric-item">
            <span class="metric-status" [class.success]="metric.success" [class.error]="!metric.success">
              {{ metric.success ? '✅' : '❌' }}
            </span>
            <span class="metric-name">{{ metric.name }}</span>
            <span class="metric-duration" [class.slow]="metric.duration > 1000">
              {{ metric.duration }}ms
            </span>
          </div>
        </div>
      </div>

      <!-- Environment Info -->
      <div class="health-section">
        <h3>🔧 Configuration</h3>
        <div class="config-grid">
          <div class="config-item">
            <span class="config-label">Environment:</span>
            <span class="config-value" [class.production]="isProduction">
              {{ isProduction ? 'Production' : 'Development' }}
            </span>
          </div>
          <div class="config-item">
            <span class="config-label">Features:</span>
            <span class="config-value">{{ enabledFeatures.join(', ') }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">Stripe:</span>
            <span class="config-value" [class.configured]="stripeConfigured">
              {{ stripeConfigured ? 'Configuré' : 'Non configuré' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="health-actions">
        <button class="action-btn" (click)="clearErrors()">🗑️ Vider erreurs</button>
        <button class="action-btn" (click)="testError()">🧪 Test erreur</button>
        <button class="action-btn" (click)="exportReport()">📄 Exporter rapport</button>
      </div>
    </div>

    <!-- Debug Toggle (visible only in dev) -->
    <div class="debug-toggle" *ngIf="!isProduction" (click)="togglePanel()">
      🏥
    </div>
  `,
  styleUrl: './system-health.component.scss'
})
export class SystemHealthComponent implements OnInit {
  showDebugPanel = false;
  healthReport: any = {
    totalErrors: 0,
    errorsByType: {},
    averagePerformance: 0,
    successRate: 100
  };
  recentErrors: any[] = [];
  recentMetrics: any[] = [];
  currentTier: any = { displayName: 'Free' };
  isProduction = environment.production;
  stripeConfigured = false;
  enabledFeatures: string[] = [];
  
  // Exposer Object pour le template
  Object = Object;

  constructor(
    private monitoringService: MonitoringService,
    private premiumService: PremiumService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    // Vérifier les permissions admin
    if (!this.configService.canAccessAdmin()) {
      this.showDebugPanel = false;
      return;
    }

    this.loadHealthData();
    this.checkConfiguration();
    
    // En development seulement, afficher le panel au début
    if (!this.isProduction) {
      this.showDebugPanel = false; // Caché par défaut
    }
    
    // Actualiser périodiquement
    const interval = this.configService.getHealthCheckInterval();
    setInterval(() => {
      if (this.showDebugPanel) {
        this.loadHealthData();
      }
    }, interval);
  }

  loadHealthData() {
    this.healthReport = this.monitoringService.getHealthReport();
    this.recentErrors = this.monitoringService.getRecentErrors();
    this.recentMetrics = this.monitoringService.getRecentMetrics();
    this.currentTier = this.premiumService.getCurrentTier();
  }

  getErrorEntries(): { type: string; count: number }[] {
    return Object.entries(this.healthReport.errorsByType || {})
      .map(([type, count]) => ({ type, count: count as number }));
  }

  checkConfiguration() {
    const config = this.configService.get();
    this.stripeConfigured = config.stripePublicKey.includes('pk_');
    
    const features = this.configService.getFeatureFlags();
    this.enabledFeatures = Object.entries(features)
      .filter(([key, value]) => value)
      .map(([key, value]) => key);
  }

  getErrorIcon(type: string): string {
    const icons: Record<string, string> = {
      payment: '💳',
      api: '🌐',
      quest: '🎮',
      premium: '👑',
      general: '⚠️'
    };
    return icons[type] || '❓';
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  togglePanel() {
    this.showDebugPanel = !this.showDebugPanel;
    if (this.showDebugPanel) {
      this.loadHealthData();
    }
  }

  hidePanel() {
    this.showDebugPanel = false;
  }

  clearErrors() {
    // Reset monitoring data
    localStorage.removeItem('monitoring_errors');
    this.loadHealthData();
    console.log('🧹 Erreurs nettoyées');
  }

  testError() {
    this.monitoringService.logError({
      type: 'general',
      message: 'Test error from system health panel',
      context: { test: true },
      timestamp: new Date()
    });
    this.loadHealthData();
    console.log('🧪 Erreur de test générée');
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      health: this.healthReport,
      errors: this.recentErrors,
      metrics: this.recentMetrics,
      environment: {
        production: this.isProduction,
        features: this.enabledFeatures,
        stripeConfigured: this.stripeConfigured
      }
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `streamyscovery-health-report-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('📄 Rapport exporté');
  }
}
