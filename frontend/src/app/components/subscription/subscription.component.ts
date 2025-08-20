import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StripeService } from '../../services/stripe.service';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

interface SubscriptionResponse {
  success: boolean;
  plans: Record<string, SubscriptionPlan>;
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  loading = true;
  error: string | null = null;
  currentPlan = 'free';

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private stripeService: StripeService
  ) {}

  ngOnInit() {
    this.loadSubscriptionPlans();
    this.loadCurrentUserPlan();
  }

  /**
   * Charger les plans d'abonnement depuis le backend
   */
  private loadSubscriptionPlans() {
    this.http.get<SubscriptionResponse>(`${this.apiUrl}/payments/plans`)
      .subscribe({
        next: (response) => {
          if (response.success && response.plans) {
            this.plans = Object.values(response.plans);
            console.log('✅ Plans d\'abonnement chargés:', this.plans);
          } else {
            this.error = 'Erreur lors du chargement des plans';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur chargement plans:', error);
          this.error = 'Impossible de charger les plans d\'abonnement';
          this.loading = false;
        }
      });
  }

  /**
   * Charger le plan actuel de l'utilisateur
   */
  private loadCurrentUserPlan() {
    // TODO: Récupérer depuis le service d'authentification
    // Pour le moment, on utilise localStorage ou valeur par défaut
    this.currentPlan = localStorage.getItem('userSubscriptionTier') || 'free';
  }

  /**
   * Sélectionner un plan d'abonnement
   */
  async selectPlan(planId: string) {
    if (planId === 'free') {
      // Plan gratuit - pas de paiement nécessaire
      this.updateUserPlan('free');
      return;
    }

    // Plans payants - utiliser Stripe
    console.log(`🔄 Sélection du plan: ${planId}`);
    this.loading = true;
    this.error = null;
    
    try {
      // Créer la session Stripe
      const session = await this.stripeService.createCheckoutSession(planId, this.getCurrentUserId()).toPromise();
      
      if (session?.sessionId) {
        console.log('✅ Session Stripe créée:', session.sessionId);
        
        // Rediriger vers Stripe Checkout
        await this.stripeService.redirectToCheckout(session.sessionId);
      } else {
        throw new Error('Session ID manquant dans la réponse');
      }
    } catch (error) {
      console.error('❌ Erreur Stripe checkout:', error);
      this.error = 'Impossible de créer la session de paiement. Veuillez réessayer.';
      this.loading = false;
    }
  }

  /**
   * Mettre à jour le plan utilisateur
   */
  private updateUserPlan(tier: string) {
    localStorage.setItem('userSubscriptionTier', tier);
    this.currentPlan = tier;
    console.log(`✅ Plan mis à jour: ${tier}`);
  }

  /**
   * Récupérer l'ID utilisateur actuel
   */
  private getCurrentUserId(): string {
    // TODO: Récupérer depuis le service d'authentification
    return localStorage.getItem('userId') || 'temp-user-1';
  }

  /**
   * Vérifier si un plan est le plan actuel
   */
  isCurrentPlan(planId: string): boolean {
    return this.currentPlan === planId;
  }

  /**
   * Obtenir le libellé du bouton selon le plan
   */
  getButtonLabel(planId: string): string {
    if (this.isCurrentPlan(planId)) {
      return 'Plan actuel';
    }
    
    switch (planId) {
      case 'free':
        return 'Gratuit';
      case 'premium':
        return 'Choisir Premium';
      case 'vip':
        return 'Choisir VIP';
      case 'legendary':
        return 'Choisir Légendaire';
      default:
        return 'Choisir ce plan';
    }
  }

  /**
   * Vérifier si le bouton doit être désactivé
   */
  isButtonDisabled(planId: string): boolean {
    return this.isCurrentPlan(planId) || this.loading;
  }
}
