import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

interface CheckoutSessionRequest {
  planId: string;
  userId?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.stripePromise = loadStripe(environment.stripePublishableKey);
  }

  /**
   * Créer une session de checkout Stripe
   */
  createCheckoutSession(planId: string, userId?: string): Observable<CheckoutSessionResponse> {
    const body: CheckoutSessionRequest = { planId, userId };
    return this.http.post<CheckoutSessionResponse>(`${this.apiUrl}/payments/create-checkout-session`, body);
  }

  /**
   * Rediriger vers Stripe Checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    try {
      const stripe = await this.stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un abonnement
   */
  getSubscriptionStatus(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/subscription-status/${userId}`);
  }

  /**
   * Annuler un abonnement
   */
  cancelSubscription(subscriptionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/cancel-subscription`, { subscriptionId });
  }

  /**
   * Obtenir l'historique des paiements
   */
  getPaymentHistory(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/history/${userId}`);
  }
}
