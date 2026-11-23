/**
 * Port to the e-mail confirmation of identity-service (US28). The link sent by e-mail carries a
 * token; confirming it turns the e-mail channel of the account on. Implementations reject with
 * ApiError: INVALID_CONFIRMATION_LINK when the link is unknown, already used or expired.
 */
export abstract class EmailConfirmationGateway {
  abstract confirm(token: string): Promise<void>;
}
