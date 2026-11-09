/**
 * Port to the radius saved in the consumer profile of Identity, so it follows the consumer to another
 * browser (US46, E2-07). Only for a consumer session; implementations reject with ApiError.
 */
export abstract class RadiusPreferenceGateway {
  abstract fetch(): Promise<number>;
  abstract save(minutes: number): Promise<void>;
}
