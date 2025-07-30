import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  twitch_id: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🚀 AuthService constructor called');
    this.checkAuthStatus();
  }

  redirectToTwitchAuth(): void {
    console.log('🔄 Redirecting to Twitch auth...');
    const clientId = environment.twitchClientId;
    const redirectUri = environment.twitchRedirectUri;
    const scope = 'user:read:email';
    
    const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}`;
    
    console.log('🌐 Auth URL:', authUrl);
    window.location.href = authUrl;
  }

  handleCallback(code: string): Observable<any> {
    console.log('🎯 Handling callback with code:', code);
    return this.http.post(`${this.apiUrl}/auth/callback`, { code })
      .pipe(
        tap((response: any) => {
          console.log('✅ Auth callback response:', response);
          if (response.token) {
            localStorage.setItem('token', response.token);
            this.isAuthenticatedSubject.next(true);
            if (response.user) {
              this.userSubject.next(response.user);
            }
          }
        })
      );
  }

  getCurrentUser(): Observable<User> {
    console.log('👤 Getting current user...');
    return this.http.get<User>(`${this.apiUrl}/auth/me`)
      .pipe(
        tap(user => {
          console.log('👤 Current user:', user);
          this.userSubject.next(user);
        })
      );
  }

  logout(): void {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getAuthHeaders(): any {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = !!token;
    console.log('🔒 Checking auth status:', isAuth);
    return isAuth;
  }

  private checkAuthStatus(): void {
    console.log('🔍 Checking initial auth status...');
    const token = this.getToken();
    if (token) {
      console.log('🎫 Token found, getting user info...');
      this.isAuthenticatedSubject.next(true);
      this.getCurrentUser().subscribe({
        next: (user) => {
          console.log('✅ User loaded:', user);
        },
        error: (error) => {
          console.error('❌ Error loading user:', error);
          this.logout();
        }
      });
    } else {
      console.log('❌ No token found');
      this.isAuthenticatedSubject.next(false);
    }
  }
}
