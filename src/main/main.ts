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
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath, sendEmailPerServer, serverChecking } from './util';
import fs from 'fs';
import axios from 'axios';
import qs from 'qs';

const config = {
  headers: {
    'Content-Type': 'multipart/form-data',
    connection: 'keep-alive',
    'Accept-Encoding': 'gzip, deflate',
    Accept: '*/*',
  },
};

var email_list = [];
var server_list = [];
var failed_count = 0;

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

ipcMain.on('email-upload', async (event, arg) => {
  let file_path = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!file_path.canceled && file_path.filePaths.length > 0) {
    fs.readFile(file_path.filePaths[0], 'utf8', (err, data) => {
      if (err) throw err;
      let emails = data.split('\r\n');
      email_list = [...emails];
      // console.log('emails:', email_list);
      event.reply('email-upload', emails.length);
    });
  }
  // console.log('path', file_path.filePaths[0]);
});

// handling server-upload
ipcMain.on('server-upload', async (event, arg) => {
  server_list = [];
  failed_count = 0;
  let file_path = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (!file_path.canceled && file_path.filePaths.length > 0) {
    fs.readFile(file_path.filePaths[0], 'utf8', async (err, data) => {
      if (err) throw err;
      let servers = data.split('\r\n');
      event.reply('total-server', servers.length);
      for (let i = 0; i < servers.length; i++) {
        axios
          .post(
            servers[i],
            qs.stringify({
              senderEmail: 'support@nagoya-boushi.org',
              senderName: 'test',
              subject: 'Server Testing',
              messageLetter: 'Hello, How are you?',
              emailList: 'joaqperalta95@gmail.com',
              messageType: '1',
              charset: 'UTF-8',
              encode: '8bit',
              action: 'send',
            })
          )
          .then((res) => {
            server_list.push(servers[i]);
            event.reply('server-upload', {
              successLength: server_list.length,
              failedLength: failed_count,
              data: server_list,
            });
            console.log('checking success');
          })
          .catch((err) => {
            console.log('checking error');
            failed_count++;
            event.reply('server-upload', {
              successLength: server_list.length,
              failedLength: failed_count,
              data: server_list,
            });
          });
      }
    });
  }
});

ipcMain.on('send-action', async (event, arg) => {
  console.log('arg', arg);
  let countPerServer = parseInt(email_list.length / arg);
  for (let i = 0; i < arg; i++) {
    if (i === arg - 1)
      sendEmailPerServer(
        event,
        server_list[i],
        i,
        email_list.slice(i * countPerServer)
      );
    else
      sendEmailPerServer(
        event,
        server_list[i],
        i,
        email_list.slice(i * countPerServer, (i + 1) * countPerServer)
      );
  }
});
