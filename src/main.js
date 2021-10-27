const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const storage = require('electron-json-storage');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 900,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
});
  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // platform specific code for mac
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// SOURCE PATH
ipcMain.on('open:source', async event => {
  const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (dir) {
    event.sender.send("chosen:source", dir.filePaths[0]);
  }
});
// OUTPUT PATH
ipcMain.on('open:output', async event => {
  const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (dir) {
    event.sender.send("chosen:output", dir.filePaths[0]);
  }
});
