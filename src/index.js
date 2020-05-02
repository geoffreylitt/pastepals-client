const { app, BrowserWindow, clipboard } = require('electron');
const fetch = require('node-fetch');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
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

let clipboardContent;
let serverContent;

// Sync clipboard with the server
async function syncClipboard() {
  let newClipboardContent = clipboard.readText();
  let response = await fetch('https://global-copypaste-buffer--glench.repl.co/get?buffer=*')
  let newServerContent = await response.text()

  // If the server has new content, download it into our local clipboard.
  // (If we recently changed our local clipboard, too bad--those changes get wiped out)
  if (newServerContent !== serverContent) {
    console.log("new server content", newServerContent)
    clipboard.writeText(newServerContent)

    // remember what was in the server clipboard
    serverContent = newServerContent;
  } else if (newClipboardContent !== clipboardContent) {
    // If the local clipboard has new contents, we upload them to the server
    console.log("new local clipboard!", newClipboardContent)

    // remember what was in the local clipboard
    clipboardContent = newClipboardContent

    // notify the API
    await fetch('https://global-copypaste-buffer--glench.repl.co/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            buffer: '*',
            value: newClipboardContent,
        })
    })
  }
}

// Every second, sync the clipboard
setInterval(syncClipboard, 1000);
