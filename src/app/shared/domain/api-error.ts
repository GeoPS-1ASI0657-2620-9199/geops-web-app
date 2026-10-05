/** Error code used when the browser could not reach the gateway. */
export const NETWORK_ERROR = 'NETWORK_ERROR';
/** Error code used when the server answered without the GeoPS error body. */
export const UNEXPECTED_ERROR = 'UNEXPECTED_ERROR';

/**
 * Failure reported by a service with the {code, message} body that every GeoPS service returns.
 * Use cases and screens decide by code; the message is already written for the user.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
