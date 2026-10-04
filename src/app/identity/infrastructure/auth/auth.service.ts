import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User } from '../../domain/model/user.entity';
import { UsersApiEndpoint } from '../users/users-api-endpoint';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private usersApi: UsersApiEndpoint) {
    this.loadUserFromStorage();
  }

  /**
   * Loads the user saved in localStorage
   */
  private loadUserFromStorage(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('[AuthService] Error parsing user:', e);
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Gets the current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Gets the current user's ID
   */
  getCurrentUserId(): number | null {
    const user = this.currentUserSubject.value;
    return user?.id ?? null;
  }

  /**
   * Checks if there is an authenticated user
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Logs in with email and password
   */
  login(email: string, password: string): Observable<User | null> {
    return this.usersApi.login(email, password).pipe(
      map(authResource => {
        if (!authResource) return null;

        const user: User = {
          id: authResource.id,
          name: authResource.name,
          email: authResource.email,
          phone: authResource.phone,
          role: authResource.role,
          plan: authResource.plan
        };

        this.setCurrentUser(user);
        return user;
      }),
      catchError(error => {
        console.error('[AuthService] Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Registers a new user
   */
  register(userData: { name: string; email: string; phone: string; password: string; role?: string; plan?: string }): Observable<User> {
    return this.usersApi.register(userData).pipe(
      map(authResource => {
        const user: User = {
          id: authResource.id,
          name: authResource.name,
          email: authResource.email,
          phone: authResource.phone,
          role: authResource.role,
          plan: authResource.plan
        };

        this.setCurrentUser(user);
        return user;
      }),
      catchError(error => {
        console.error('[AuthService] Registration failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logs out
   */
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  /**
   * Sets the current user and saves it in localStorage
   */
  public setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Updates the current user
   */
  updateUser(user: User): Observable<User> {
    return this.usersApi.update(user, user.id).pipe(
      map((updatedUser: User) => {
        this.setCurrentUser(updatedUser);
        return updatedUser;
      }),
      catchError(error => {
        console.error('[AuthService] Update failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh current user from API
   * Useful if user data might have changed
   */
  refreshCurrentUser(): Observable<User | null> {
    const user = this.getCurrentUser();
    if (!user?.email) {
      console.warn('[AuthService] No authenticated user to refresh');
      return new Observable(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.usersApi.getMe(user.email).pipe(
      map(refreshedUser => {
        this.setCurrentUser(refreshedUser);
        return refreshedUser;
      }),
      catchError(error => {
        console.error('[AuthService] Refresh failed:', error);
        return throwError(() => error);
      })
    );
  }
}

