/// <reference types="vite/client" />

interface ElectronAPI {
  openProject: () => Promise<{ canceled?: boolean; error?: string; projectPath?: string }>;
  ptySpawn: (cwd: string) => Promise<void>;
  ptyWrite: (data: string) => void;
  ptyResize: (cols: number, rows: number) => void;
  ptyKill: () => void;
  onPtyData: (callback: (data: string) => void) => void;
  onPtyExit: (callback: (code: number) => void) => void;
}

interface Window {
  electronAPI: ElectronAPI;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
