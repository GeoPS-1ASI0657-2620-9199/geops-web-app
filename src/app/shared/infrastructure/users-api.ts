import { Injectable } from '@angular/core';
import { BaseApi } from './base-api';
import { UsersApiEndpoint } from './users-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../domain/model/user.entity';

@Injectable({
  providedIn: 'root',
})
export class UsersApi extends BaseApi {
  private readonly usersEndpoint: UsersApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.usersEndpoint = new UsersApiEndpoint(http);
  }

  getUsers(): Observable<User[]> {
    return this.usersEndpoint.getAll();
  }

  getUser(id: number): Observable<User> {
    return this.usersEndpoint.getById(id);
  }

  createUser(user: User): Observable<User> {
    return this.usersEndpoint.create(user);
  }

  updateUser(user: User): Observable<User> {
    return this.usersEndpoint.update(user, user.id);
  }

  deleteUser(id: number): Observable<void> {
    return this.usersEndpoint.delete(id);
  }

  /**
   * Updates user's subscription plan
   * @param userId - The user ID
   * @param planType - The new plan type
   * @returns Observable of updated user
   */
  updateUserPlan(userId: number = 1, planType: 'BASIC' | 'PREMIUM'): Observable<User> {
    return new Observable((observer) => {
      this.getUser(userId).subscribe({
        next: (user) => {
          const updatedUser = { ...user, plan: planType };
          this.updateUser(updatedUser).subscribe({
            next: (result) => observer.next(result),
            error: (error) => observer.error(error),
          });
        },
        error: (error) => observer.error(error),
      });
    });
  }
}
