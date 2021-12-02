/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  IpcMainEvent,
} from 'electron';
import fs from 'fs';
import FormData from 'form-data';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath, sendEmailPerServer, serverTesting } from './util';
import { SendData } from '../type';

process.setMaxListeners(Infinity);

global.emailList = [];
global.serverList = [];
global.names = [];
global.subjects = [];
global.senEmails = [];
global.message = '';
global.ranNamStatus = false;
global.ranSenEmaStatus = false;
global.ranSubStatus = false;
global.usedCount = 0;
global.limitPerServer = 100;
global.couPerReplace = 1000;
global.failedCount = 0;
global.total = 0;
//form data
global.subject = '';
global.senName = '';
global.senEmail = '';
global.failedEmails = [];
export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

ipcMain.on('email-upload', async (event: IpcMainEvent): Promise<void> => {
  const filePath = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!filePath.canceled && filePath.filePaths.length > 0) {
    fs.readFile(filePath.filePaths[0], 'utf8', (err, data) => {
      if (err) throw err;
      emailList = data.split('\r\n');
      event.reply('email-upload', emailList.length);
    });
  }
});

// handling server-upload
ipcMain.on('server-upload', async (event: IpcMainEvent): Promise<void> => {
  serverList = [];
  failedCount = 0;
  let filePath = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!filePath.canceled && filePath.filePaths.length > 0) {
    fs.readFile(filePath.filePaths[0], 'utf8', async (err, data) => {
      if (err) throw err;
      const servers = data.split('\r\n');
      event.reply('total-server', servers.length);
      for (let i = 0; i < servers.length; i += 1) {
        serverTesting(event, servers[i]);
      }
    });
  }
});

ipcMain.on(
  'send-action',
  async (event: IpcMainEvent, args: SendData): Promise<void> => {
    ranNamStatus = args.ranNamStatus;
    ranSenEmaStatus = args.ranSenEmaStatus;
    ranSubStatus = args.ranSubStatus;
    usedCount = args.usedCount;
    limitPerServer = args.limit;
    couPerReplace = args.couPerReplace;
    total = 0;
    if(failedEmails.length > 0) {
      emailList = failedEmails;
      failedEmails = [];
    }
    while (total < emailList.length) {
      for (let i = 0; i < usedCount; i += 1) {
        if (total + 10 > emailList.length) {
          sendEmailPerServer(event, i, total, emailList.length);
          total = emailList.length;
        } else {
          sendEmailPerServer(event, i, total, total + 10);
          total += 10;
        }
      }
    }
  }
);

ipcMain.on('names-upload', async (event: IpcMainEvent): Promise<void> => {
  const filePath = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!filePath.canceled && filePath.filePaths.length > 0) {
    fs.readFile(filePath.filePaths[0], 'utf8', (err, data) => {
      if (err) throw err;
      names = data.split('\r\n');

      event.reply('names-upload', names.length);
    });
  }
});

ipcMain.on('subjects-upload', async (event: IpcMainEvent): Promise<void> => {
  const filePath = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!filePath.canceled && filePath.filePaths.length > 0) {
    fs.readFile(filePath.filePaths[0], 'utf8', (err, data) => {
      if (err) throw err;
      subjects = data.split('\r\n');

      event.reply('subjects-upload', subjects.length);
    });
  }
});

ipcMain.on('senEmails-upload', async (event: IpcMainEvent): Promise<void> => {
  const filePath = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!filePath.canceled && filePath.filePaths.length > 0) {
    fs.readFile(filePath.filePaths[0], 'utf8', (err, data) => {
      if (err) throw err;
      senEmails = data.split('\r\n');

      event.reply('senEmails-upload', senEmails.length);
    });
  }
});

ipcMain.on('message-upload', async (event: IpcMainEvent): Promise<void> => {
  const filePath = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!filePath.canceled && filePath.filePaths.length > 0) {
    fs.readFile(filePath.filePaths[0], 'utf8', (err, data) => {
      if (err) throw err;
      message = data;

      event.reply('message-upload', path.basename(filePath.filePaths[0]));
    });
  }
});

ipcMain.on('attachement-upload', async (event: IpcMainEvent): Promise<void> => {
  const filePath = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!filePath.canceled && filePath.filePaths.length > 0) {
    fs.readFile(filePath.filePaths[0], (err, data) => {
      if (err) throw err;
      global.attachment = data;
      global.fileName = path.basename(filePath.filePaths[0]);

      event.reply('attachement-upload', fileName);
    });
  }
});

ipcMain.on('clear-all', (event: IpcMainEvent): void => {
  emailList = [];
  serverList = [];
  names = [];
  subjects = [];
  senEmails = [];
  message = '';
  ranNamStatus = false;
  ranSenEmaStatus = false;
  ranSubStatus = false;
  usedCount = 0;
  limitPerServer = 100;
  couPerReplace = 1000;
  failedCount = 0;
  total = 0;
  subject = '';
  senName = '';
  senEmail = '';
});

ipcMain.on('resend', (event: IpcMainEvent, args: string[]): void => {
  serverList = args;
});
