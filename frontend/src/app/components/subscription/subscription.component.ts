import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, PaymentPlans, SubscriptionPlan } from '../../services/payment.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
  plans: PaymentPlans | null = null;
  isLoading = false;
  error: string | null = null;
  isAuthenticated = false;

  // Plan actuellement sélectionné pour l'achat
  selectedPlan: string | null = null;
  isProcessingPayment = false;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadSubscriptionPlans();
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  checkAuthentication(): void {
    this.isAuthenticated = this.paymentService.isUserAuthenticated();
  }

  /**
   * Charger les plans d'abonnement depuis l'API
   */
  loadSubscriptionPlans(): void {
    this.isLoading = true;
    this.error = null;

    this.paymentService.getSubscriptionPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des plans:', error);
        this.error = 'Impossible de charger les plans d\'abonnement';
        this.isLoading = false;
      }
    });
  }

  /**
   * Sélectionner un plan et lancer le processus de paiement
   */
  selectPlan(planType: string): void {
    if (!this.isAuthenticated) {
      this.paymentService.redirectToLogin();
      return;
    }

    if (this.isProcessingPayment) {
      return; // Éviter les clics multiples
    }

    this.selectedPlan = planType;
    this.isProcessingPayment = true;
    this.error = null;

    this.paymentService.createCheckoutSession(planType).subscribe({
      next: (response) => {
        console.log('Réponse session checkout:', response);
        
        if (response.success) {
          if (response.mock) {
            // Mode développement - afficher un message
            alert(`🎉 Mode développement\n\n${response.message}\n\nPlan: ${response.plan?.name}\nSession ID: ${response.session_id}`);
          } else if (response.checkout_url) {
            // Redirection vers Stripe Checkout
            window.location.href = response.checkout_url;
          }
        } else {
          this.error = response.message || 'Erreur lors de la création de la session';
        }
        
        this.isProcessingPayment = false;
        this.selectedPlan = null;
      },
      error: (error) => {
        console.error('Erreur création session:', error);
        this.error = error.message || 'Erreur lors de la création de la session de paiement';
        this.isProcessingPayment = false;
        this.selectedPlan = null;
      }
    });
  }

  /**
   * Obtenir les fonctionnalités formatées d'un plan
   */
  getPlanFeatures(plan: SubscriptionPlan): string[] {
    if (!plan.features) return [];
    
    return plan.features.map(feature => {
      switch (feature) {
        case 'xp_boost_5': return '🚀 Boost XP +5%';
        case 'xp_boost_10': return '🚀 Boost XP +10%';
        case 'xp_boost_15': return '🚀 Boost XP +15%';
        case 'extra_quests_2': return '🎯 +2 quêtes quotidiennes';
        case 'extra_quests_3': return '🎯 +3 quêtes quotidiennes';
        case 'extra_quests_4': return '🎯 +4 quêtes quotidiennes';
        case 'premium_themes': return '🎨 Thèmes Premium exclusifs';
        case 'vip_themes': return '🎨 Thèmes VIP avancés';
        case 'legendary_themes': return '🎨 Thèmes Légendaires';
        case 'analytics_personal': return '📊 Analytics personnelles';
        case 'analytics_advanced': return '📊 Analytics avancées';
        case 'priority_support': return '🛟 Support prioritaire';
        case 'exclusive_badges': return '🏅 Badges exclusifs';
        default: return feature;
      }
    });
  }

  /**
   * Obtenir la classe CSS pour un plan
   */
  getPlanClass(planType: string): string {
    switch (planType) {
      case 'premium': return 'plan-premium';
      case 'vip': return 'plan-vip';
      case 'legendary': return 'plan-legendary';
      default: return 'plan-default';
    }
  }

  /**
   * Vérifier si un plan est en cours de traitement
   */
  isPlanProcessing(planType: string): boolean {
    return this.isProcessingPayment && this.selectedPlan === planType;
  }

  /**
   * Obtenir le texte du bouton pour un plan
   */
  getButtonText(planType: string): string {
    if (this.isPlanProcessing(planType)) {
      return 'Traitement...';
    }
    
    if (!this.isAuthenticated) {
      return 'Se connecter pour s\'abonner';
    }
    
    return 'Choisir ce plan';
  }

  /**
   * Retry pour recharger les plans en cas d'erreur
   */
  retryLoadPlans(): void {
    this.loadSubscriptionPlans();
  }
}
