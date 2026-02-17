/**
 * Configuration for a specific hook.
 */
export interface HookConfig {
  /**
   * List of directive names configured for this hook.
   */
  readonly directives: readonly string[];
}
