import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { MonitoringService } from '../services/monitoring.service';
import { RateLimitService } from '../services/rate-limit.service';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';

@Injectable()
export class MonitoringInterceptor implements HttpInterceptor {
  constructor(
    private monitoringService: MonitoringService,
    private rateLimitService: RateLimitService,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();
    const currentUser = this.authService.getCurrentUserSync();
    const userId = currentUser?.id;

    // Vérifier le rate limiting pour les APIs locales
    if (req.url.includes('/api/')) {
      const endpoint = this.extractEndpoint(req.url);
      if (!this.rateLimitService.checkApiLimit(endpoint, userId)) {
        // Bloquer la requête si rate limit dépassé
        this.monitoringService.logError({
          type: 'api',
          message: 'Rate limit exceeded',
          context: { endpoint, method: req.method, userId },
          timestamp: new Date(),
          userId
        });

        return throwError(() => new HttpErrorResponse({
          status: 429,
          statusText: 'Too Many Requests',
          error: { message: 'Rate limit exceeded. Please try again later.' }
        }));
      }
    }

    // Ajouter des headers de monitoring
    const monitoredReq = req.clone({
      setHeaders: {
        'X-Request-ID': this.generateRequestId(),
        'X-Timestamp': startTime.toString(),
        ...(userId && { 'X-User-ID': userId })
      }
    });

    return next.handle(monitoredReq).pipe(
      tap(() => {
        // Enregistrer les métriques de performance pour les requêtes réussies
        const duration = Date.now() - startTime;
        this.monitoringService.logPerformance({
          name: `${req.method} ${this.extractEndpoint(req.url)}`,
          duration,
          timestamp: new Date(),
          success: true
        });
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = Date.now() - startTime;
        
        // Enregistrer l'erreur
        this.monitoringService.logError({
          type: this.determineErrorType(req.url),
          message: `HTTP ${error.status}: ${error.message}`,
          context: {
            url: req.url,
            method: req.method,
            status: error.status,
            statusText: error.statusText,
            duration,
            body: req.body
          },
          timestamp: new Date(),
          userId
        });

        // Enregistrer les métriques de performance pour les requêtes échouées
        this.monitoringService.logPerformance({
          name: `${req.method} ${this.extractEndpoint(req.url)}`,
          duration,
          timestamp: new Date(),
          success: false
        });

        return throwError(() => error);
      })
    );
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  private determineErrorType(url: string): 'payment' | 'api' | 'quest' | 'premium' | 'general' {
    if (url.includes('stripe') || url.includes('payment')) {
      return 'payment';
    }
    if (url.includes('quest')) {
      return 'quest';
    }
    if (url.includes('premium') || url.includes('subscription')) {
      return 'premium';
    }
    if (url.includes('/api/')) {
      return 'api';
    }
    return 'general';
  }

  private generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}
