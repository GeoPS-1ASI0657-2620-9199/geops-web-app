import { BaseResource, BaseResponse } from './base-response';

/**
 * User resource from the API
 */
export interface UserResource extends BaseResource {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'CONSUMER' | 'ADMIN';
  plan: 'BASIC' | 'PREMIUM';
}

/**
 * API response for multiple users
 */
export interface UsersResponse extends BaseResponse {
  users: UserResource[];
}
