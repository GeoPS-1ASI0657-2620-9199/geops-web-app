/** Port to where this browser keeps the last walking radius the visitor chose (US46, E2-07). */
export abstract class RadiusPreferenceStore {
  /** The saved radius, or null when there is none or it is not a valid one. Never throws. */
  abstract read(): number | null;
  /** Never throws: without storage the search just starts from the default radius. */
  abstract write(minutes: number): void;
}
