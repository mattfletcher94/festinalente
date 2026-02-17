/**
 * Settings domain types.
 */

/**
 * Panel size configuration.
 */
export interface PanelSizes {
  readonly taskList: number;
  readonly taskDetail: number;
  readonly terminal: number;
}

/**
 * Application settings from storage.
 * On first run, these may not exist yet.
 */
export interface AppSettings {
  /** Project path, undefined if never set. */
  readonly projectPath: string | undefined;
  /** Panel sizes, undefined if never set. */
  readonly panelSizes: PanelSizes | undefined;
}

/**
 * Project selection result from dialog.
 */
export interface ProjectSelectionResult {
  /** Whether the user canceled the dialog. */
  readonly canceled: boolean;
  /** Error message if selection failed. */
  readonly error: string | undefined;
  /** Selected path if successful. */
  readonly projectPath: string | undefined;
}
