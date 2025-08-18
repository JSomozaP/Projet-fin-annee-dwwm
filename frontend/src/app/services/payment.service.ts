import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface SubscriptionPlan {
  name: string;
  price: number;
  features: string[];
}

export interface PaymentPlans {
  premium: SubscriptionPlan;
  vip: SubscriptionPlan;
  legendary: SubscriptionPlan;
}

export interface CheckoutSessionResponse {
  success: boolean;
  mock?: boolean;
  message: string;
  plan?: SubscriptionPlan;
  user_id?: string;
  session_id?: string;
  timestamp?: string;
  checkout_url?: string;
}

export interface ApiTestResponse {
  success: boolean;
  message: string;
  timestamp: string;
  stripe_available: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:3000/api/payments';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Récupérer les en-têtes d'authentification
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Tester la disponibilité de l'API Payment
   */
  testPaymentApi(): Observable<ApiTestResponse> {
    return this.http.get<ApiTestResponse>(`${this.apiUrl}/test`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer tous les plans d'abonnement disponibles
   */
  getSubscriptionPlans(): Observable<PaymentPlans> {
    return this.http.get<PaymentPlans>(`${this.apiUrl}/plans`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer une session de checkout pour un plan donné
   * @param planType - Le type de plan ('premium', 'vip', 'legendary')
   */
  createCheckoutSession(planType: string): Observable<CheckoutSessionResponse> {
    const headers = this.getAuthHeaders();
    const body = { plan: planType };

    return this.http.post<CheckoutSessionResponse>(
      `${this.apiUrl}/create-checkout-session`, 
      body, 
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer le statut d'abonnement de l'utilisateur connecté
   * TODO: À implémenter côté backend
   */
  getSubscriptionStatus(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.get(`${this.apiUrl}/subscription-status`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Annuler l'abonnement de l'utilisateur connecté
   * TODO: À implémenter côté backend
   */
  cancelSubscription(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.post(`${this.apiUrl}/cancel-subscription`, {}, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: any) {
    console.error('Erreur PaymentService:', error);
    
    let errorMessage = 'Une erreur inattendue s\'est produite';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isUserAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Rediriger vers la connexion si nécessaire
   */
  redirectToLogin(): void {
    // TODO: Implémenter la redirection vers la page de connexion
    console.log('Redirection vers la page de connexion nécessaire');
  }
}
