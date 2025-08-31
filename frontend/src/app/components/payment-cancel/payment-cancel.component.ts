import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cancel-container">
      <div class="cancel-card">
        <div class="cancel-icon">
          <div class="cross">✕</div>
        </div>
        
        <h1>Paiement annulé</h1>
        <p class="cancel-message">
          Aucun souci ! Votre paiement a été annulé et aucun montant n'a été débité.
        </p>
        
        <div class="info-box">
          <h3>💡 Pourquoi choisir un abonnement premium ?</h3>
          <ul>
            <li>🚀 <strong>Boost XP +5%</strong> pour progresser plus vite</li>
            <li>🎯 <strong>+2 quêtes quotidiennes</strong> pour plus de défis</li>
            <li>🏆 <strong>Quêtes premium exclusives</strong> avec récompenses uniques</li>
            <li>💎 <strong>Badge Premium</strong> qui vous distingue</li>
            <li>🎨 <strong>Thèmes cosmétiques</strong> pour personnaliser votre expérience</li>
          </ul>
        </div>
        
        <div class="action-buttons">
          <button class="btn-primary" (click)="goBackToPlans()">
            💳 Voir les plans d'abonnement
          </button>
          <button class="btn-secondary" (click)="continueAsFree()">
            🆓 Continuer en gratuit
          </button>
        </div>
        
        <div class="support-info">
          <p>Des questions ? Contactez-nous à</p>
          <a href="mailto:support&#64;streamyscovery.com">support&#64;streamyscovery.com</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cancel-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 20px;
    }
    
    .cancel-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
    
    .cancel-icon {
      margin-bottom: 30px;
    }
    
    .cross {
      display: inline-block;
      width: 80px;
      height: 80px;
      background: linear-gradient(45deg, #ff6b6b, #ffa726);
      border-radius: 50%;
      color: white;
      font-size: 40px;
      line-height: 80px;
      animation: shake 0.8s ease;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 28px;
    }
    
    .cancel-message {
      color: #34495e;
      font-size: 16px;
      margin-bottom: 25px;
    }
    
    .info-box {
      background: linear-gradient(135deg, #667eea20, #764ba220);
      padding: 25px;
      border-radius: 15px;
      margin-bottom: 25px;
      text-align: left;
      border: 1px solid #667eea30;
    }
    
    .info-box h3 {
      color: #667eea;
      margin-bottom: 15px;
      text-align: center;
    }
    
    .info-box ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .info-box li {
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 25px;
    }
    
    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
    }
    
    .btn-primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    
    .btn-secondary:hover {
      background: #667eea;
      color: white;
    }
    
    .support-info {
      color: #6c757d;
      font-size: 14px;
    }
    
    .support-info a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    
    .support-info a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      .cancel-card {
        padding: 30px 20px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class PaymentCancelComponent {
  constructor(private router: Router) {}

  goBackToPlans() {
    this.router.navigate(['/subscription']);
  }

  continueAsFree() {
    this.router.navigate(['/discovery']);
  }
}
