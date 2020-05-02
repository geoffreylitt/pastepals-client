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

// See if the clipboard has changed
async function getLocalClipboard() {
  let newClipboardContent = clipboard.readText();
  let response = await fetch('https://global-copypaste-buffer--glench.repl.co/get?buffer=*')
  let newServerContent = await response.text()

  if (newServerContent !== serverContent) {
    console.log("new server content", newClipboardContent)
    clipboard.writeText(newServerContent)
    serverContent = newServerContent;
  } else if (newClipboardContent !== clipboardContent) {
    console.log("new clipboard!", newClipboardContent)

    // remember what was in the clipboard, so we can
    // compare against it next time we check
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

// Every second, see if clipboard has new stuff
setInterval(getLocalClipboard, 1000);
