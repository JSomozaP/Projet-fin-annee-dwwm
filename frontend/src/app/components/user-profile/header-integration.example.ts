// Exemple d'intégration dans le header Angular

import { Component, ViewChild } from '@angular/core';
import { UserProfileComponent } from './user-profile.component';

@Component({
  selector: 'app-header',
  template: `<!-- Template example -->`
})
export class HeaderComponent {
  @ViewChild(UserProfileComponent) userProfile!: UserProfileComponent;

  // Méthode à appeler quand on clique sur le nom d'utilisateur
  openUserProfile() {
    this.userProfile.openProfile();
  }
}

// Dans le template du header
// Remplacer le span du nom d'utilisateur par :
/*
<span class="username-clickable" (click)="openUserProfile()">
  {{ user?.username }}
</span>

<!-- Ajouter le composant profil -->
<app-user-profile #userProfile></app-user-profile>
*/

// CSS pour rendre le nom cliquable
/*
.username-clickable {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.username-clickable:hover {
  background-color: rgba(145, 70, 255, 0.2);
  color: #fff;
}
*/
