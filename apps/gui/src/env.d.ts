/// <reference types="vite/client" />

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  labels?: string[];
  path: string;
}

interface TaskFiles {
  task: boolean;
  spec: boolean;
  plan: boolean;
}

interface PanelSizes {
  taskList: number;
  taskDetail: number;
  terminal: number;
}

interface AppSettings {
  projectPath: string | null;
  panelSizes: PanelSizes;
}

interface ElectronAPI {
  openProject: () => Promise<{ canceled?: boolean; error?: string; projectPath?: string }>;
  ptySpawn: (cwd: string) => Promise<void>;
  ptyRunCommand: (cwd: string, command: string) => Promise<void>;
  ptyWrite: (data: string) => void;
  ptyResize: (cols: number, rows: number) => void;
  ptyKill: () => void;
  onPtyData: (callback: (data: string) => void) => void;
  onPtyExit: (callback: (code: number) => void) => void;
  listTasks: (projectPath: string) => Promise<Task[]>;
  readTaskFile: (projectPath: string, taskId: string) => Promise<string>;
  getAvailableTaskFiles: (projectPath: string, taskId: string) => Promise<TaskFiles>;
  readSpecFile: (projectPath: string, taskId: string) => Promise<string | null>;
  readPlanFile: (projectPath: string, taskId: string) => Promise<string | null>;
  getSetting: <T>(key: string) => Promise<T>;
  setSetting: (key: string, value: unknown) => Promise<void>;
  getAllSettings: () => Promise<AppSettings>;
  getHookConfig: (projectPath: string, hookName: string) => Promise<{ directives: string[] }>;
}

interface Window {
  electronAPI: ElectronAPI;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
