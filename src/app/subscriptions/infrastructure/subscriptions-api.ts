import { Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { SubscriptionsApiEndpoint } from './subscriptions-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subscription } from '../domain/model/subscription.entity';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsApi extends BaseApi {
  private readonly subscriptionsEndpoint: SubscriptionsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.subscriptionsEndpoint = new SubscriptionsApiEndpoint(http);
  }

  getSubscriptions(): Observable<Subscription[]> {
    return this.subscriptionsEndpoint.getAll();
  }

  getSubscription(id: number): Observable<Subscription> {
    return this.subscriptionsEndpoint.getById(id);
  }

  createSubscription(subscription: Subscription): Observable<Subscription> {
    return this.subscriptionsEndpoint.create(subscription);
  }

  updateSubscription(subscription: Subscription): Observable<Subscription> {
    return this.subscriptionsEndpoint.update(subscription, subscription.id);
  }

  deleteSubscription(id: number): Observable<void> {
    return this.subscriptionsEndpoint.delete(id);
  }
}
