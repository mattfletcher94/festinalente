/**
 * App feature - top-level application orchestration.
 */

// Orchestrator
export {
  createAppOrchestrator,
  type CreateAppOrchestratorOptions,
  type CreateAppOrchestratorReturn,
} from './app.orchestrator';

// Provider
export { injectApp, provideApp, APP_KEY, type AppContext } from './app.provider';
