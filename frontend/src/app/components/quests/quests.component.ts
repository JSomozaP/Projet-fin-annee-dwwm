import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement';
  category: string;
  xpReward: number;
  badgeReward?: string;
  requirement: number;
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
}

interface UserProgression {
  level: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
  badges: string[];
  titles: string[];
  currentTitle?: string;
}

@Component({
  selector: 'app-quests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quests.component.html',
  styleUrl: './quests.component.scss'
})
export class QuestsComponent implements OnInit {
  quests: Quest[] = [];
  userProgression: UserProgression | null = null;
  isLoading = true;
  isAuthenticated = false;

  // Filtres
  selectedType: string = 'all';
  questTypes = [
    { value: 'all', label: 'Toutes' },
    { value: 'daily', label: 'Quotidiennes' },
    { value: 'weekly', label: 'Hebdomadaires' },
    { value: 'monthly', label: 'Mensuelles' },
    { value: 'achievement', label: 'Succès' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuth();
  }

  private checkAuth() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.loadQuests();
      this.loadUserProgression();
    } else {
      this.isLoading = false;
    }
  }

  private async loadQuests() {
    try {
      const response = await fetch('/api/quests', {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.quests = data.data || [];
      }
    } catch (error) {
      console.error('Erreur chargement quêtes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUserProgression() {
    try {
      const response = await fetch('/api/quests/progression', {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.userProgression = data.data;
      }
    } catch (error) {
      console.error('Erreur chargement progression:', error);
    }
  }

  get filteredQuests(): Quest[] {
    if (this.selectedType === 'all') {
      return this.quests;
    }
    return this.quests.filter(quest => quest.type === this.selectedType);
  }

  get completedQuests(): Quest[] {
    return this.quests.filter(quest => quest.isCompleted);
  }

  getProgressPercentage(quest: Quest): number {
    return Math.min((quest.progress / quest.requirement) * 100, 100);
  }

  getQuestTypeIcon(type: string): string {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'monthly': return '🗓️';
      case 'achievement': return '🏆';
      default: return '🎯';
    }
  }

  getQuestCategoryIcon(category: string): string {
    switch (category) {
      case 'discovery': return '🔍';
      case 'social': return '👥';
      case 'engagement': return '💬';
      case 'milestone': return '🎖️';
      default: return '⭐';
    }
  }

  login() {
    this.authService.redirectToTwitchAuth();
  }

  // Méthode pour trackBy dans ngFor
  trackByQuestId(index: number, quest: any): string {
    return quest.id;
  }

  goToDiscovery() {
    this.router.navigate(['/discovery']);
  }

  selectFilter(type: string) {
    this.selectedType = type;
  }

  // Calculer le pourcentage d'XP pour la barre de niveau
  getLevelProgressPercentage(): number {
    if (!this.userProgression) return 0;
    return (this.userProgression.currentXP / this.userProgression.nextLevelXP) * 100;
  }
}
