import type { InjectionKey } from 'vue';

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { inject, provide } from 'vue';

/**
 * Merge class names with Tailwind CSS conflict resolution.
 *
 * @param inputs - Class values to merge.
 * @returns Merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Create a typed context for Vue provide/inject.
 *
 * @param providerComponentName - The name(s) of the component(s) providing the context.
 *   Used in error messages when injection fails.
 * @param contextName - Optional description for the injection key symbol.
 * @returns A tuple of [injectContext, provideContext, injectionKey].
 *
 * @example
 * ```ts
 * const [injectApp, provideApp, APP_KEY] = createContext<AppState>('App');
 *
 * // In provider component
 * const app = createAppOrchestrator({ ... });
 * provideApp(app);
 *
 * // In consumer component
 * const app = injectApp();
 * ```
 */
export function createContext<ContextValue>(
  providerComponentName: string | string[],
  contextName?: string
): readonly [
  () => ContextValue,
  (contextValue: ContextValue) => ContextValue,
  InjectionKey<ContextValue>,
] {
  const symbolDescription =
    typeof providerComponentName === 'string' && !contextName
      ? `${providerComponentName}Context`
      : contextName;

  const injectionKey: InjectionKey<ContextValue> = Symbol(symbolDescription);

  /**
   * Inject the context value.
   *
   * @returns The injected context value.
   * @throws Error when context injection fails.
   */
  function injectContext(): ContextValue {
    const context = inject(injectionKey);
    if (context !== undefined) {
      return context;
    }

    throw new Error(
      `Injection \`${injectionKey.toString()}\` not found. Component must be used within ${
        Array.isArray(providerComponentName)
          ? `one of the following components: ${providerComponentName.join(', ')}`
          : `\`${providerComponentName}\``
      }`
    );
  }

  /**
   * Provide the context value to child components.
   *
   * @param contextValue - The value to provide.
   * @returns The provided value (for chaining).
   */
  function provideContext(contextValue: ContextValue): ContextValue {
    provide(injectionKey, contextValue);
    return contextValue;
  }

  return [injectContext, provideContext, injectionKey] as const;
}
