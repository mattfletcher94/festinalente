import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { XMLParser } from 'fast-xml-parser';
import yaml from 'js-yaml';
import Store from 'electron-store';
import { spawnClaude, runClaudeCommand, writeToPty, resizePty, killPty } from './pty-service';

const require = createRequire(import.meta.url);

// XML parser for task files
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text',
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Settings store
interface StoreSchema {
  projectPath: string | null;
  panelSizes: {
    taskList: number;
    taskDetail: number;
    terminal: number;
  };
}

const store = new Store<StoreSchema>({
  defaults: {
    projectPath: null,
    panelSizes: {
      taskList: 20,
      taskDetail: 40,
      terminal: 40,
    },
  },
});

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, '../preload/index.mjs');
const indexHtml = path.join(RENDERER_DIST, 'index.html');

async function createWindow() {
  win = new BrowserWindow({
    title: 'Claude Kanban',
    width: 1400,
    height: 800,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC: Open project dialog
ipcMain.handle('dialog:openProject', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (result.canceled) return { canceled: true };

  const projectPath = result.filePaths[0];
  const kanbanPath = path.join(projectPath, '.kanban');

  if (!fs.existsSync(kanbanPath)) {
    return { error: 'No .kanban folder found in selected directory' };
  }

  return { projectPath };
});

// IPC: PTY handlers
ipcMain.handle('pty:spawn', (_, cwd: string) => {
  spawnClaude(
    cwd,
    (data) => win?.webContents.send('pty:data', data),
    (code) => win?.webContents.send('pty:exit', code)
  );
});

ipcMain.handle('pty:runCommand', (_, cwd: string, command: string) => {
  runClaudeCommand(
    cwd,
    command,
    (data) => win?.webContents.send('pty:data', data),
    (code) => win?.webContents.send('pty:exit', code)
  );
});

ipcMain.on('pty:write', (_, data: string) => writeToPty(data));
ipcMain.on('pty:resize', (_, cols: number, rows: number) => resizePty(cols, rows));
ipcMain.on('pty:kill', () => killPty());

// IPC: List tasks from .kanban/tasks/
ipcMain.handle('tasks:list', async (_, projectPath: string) => {
  const tasksDir = path.join(projectPath, '.kanban', 'tasks');
  const tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority?: string;
    labels?: string[];
    path: string;
  }> = [];

  if (!fs.existsSync(tasksDir)) return tasks;

  const taskFolders = fs.readdirSync(tasksDir);

  for (const folder of taskFolders) {
    const taskFile = path.join(tasksDir, folder, 'task.xml');
    if (!fs.existsSync(taskFile)) continue;

    try {
      const content = fs.readFileSync(taskFile, 'utf-8');
      const result = xmlParser.parse(content);
      const data = result.task;

      // Parse labels from XML structure
      let labels: string[] | undefined;
      if (data.labels?.label) {
        labels = Array.isArray(data.labels.label) ? data.labels.label : [data.labels.label];
      }

      tasks.push({
        id: (data.id as string) || folder,
        title: (data.title as string) || 'Untitled',
        status: (data.status as string) || 'backlog',
        priority: data.priority as string | undefined,
        labels,
        path: taskFile,
      });
    } catch (err) {
      console.error(`Failed to parse task ${folder}:`, err);
    }
  }

  return tasks;
});

// IPC: Read task file content
ipcMain.handle('tasks:read', async (_, projectPath: string, taskId: string) => {
  const taskFile = path.join(projectPath, '.kanban', 'tasks', taskId, 'task.xml');

  if (!fs.existsSync(taskFile)) {
    throw new Error(`Task ${taskId} not found`);
  }

  return fs.readFileSync(taskFile, 'utf-8');
});

// IPC: Check which task files exist (spec, plan)
ipcMain.handle('tasks:getAvailableFiles', async (_, projectPath: string, taskId: string) => {
  const taskDir = path.join(projectPath, '.kanban', 'tasks', taskId);

  return {
    task: fs.existsSync(path.join(taskDir, 'task.xml')),
    spec: fs.existsSync(path.join(taskDir, 'spec.xml')),
    plan: fs.existsSync(path.join(taskDir, 'plan.xml')),
  };
});

// IPC: Read spec file content
ipcMain.handle('tasks:readSpec', async (_, projectPath: string, taskId: string) => {
  const specFile = path.join(projectPath, '.kanban', 'tasks', taskId, 'spec.xml');

  if (!fs.existsSync(specFile)) {
    return null;
  }

  return fs.readFileSync(specFile, 'utf-8');
});

// IPC: Read plan file content
ipcMain.handle('tasks:readPlan', async (_, projectPath: string, taskId: string) => {
  const planFile = path.join(projectPath, '.kanban', 'tasks', taskId, 'plan.xml');

  if (!fs.existsSync(planFile)) {
    return null;
  }

  return fs.readFileSync(planFile, 'utf-8');
});

// IPC: Settings handlers
ipcMain.handle('settings:get', (_, key: keyof StoreSchema) => {
  return store.get(key);
});

ipcMain.handle('settings:set', (_, key: keyof StoreSchema, value: unknown) => {
  store.set(key, value);
});

ipcMain.handle('settings:getAll', () => {
  return store.store;
});

// IPC: Get hook config from .kanban/config.yaml
ipcMain.handle('hooks:getConfig', async (_, projectPath: string, hookName: string) => {
  const configPath = path.join(projectPath, '.kanban', 'config.yaml');

  if (!fs.existsSync(configPath)) {
    return { directives: [] };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as { hooks?: Record<string, { directives?: string[] }> };
    const hookConfig = config?.hooks?.[hookName];
    return { directives: hookConfig?.directives ?? [] };
  } catch {
    return { directives: [] };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  killPty();
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
