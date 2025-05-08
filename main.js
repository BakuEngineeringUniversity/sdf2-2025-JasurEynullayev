const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store({ name: 'transactions' });

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('add-transaction', (event, data) => {
  const transactions = store.get('list') || [];
  transactions.push(data);
  store.set('list', transactions);
});

ipcMain.handle('get-transactions', () => {
  return store.get('list') || [];
});

ipcMain.on('delete-transaction', (event, index) => {
  const transactions = store.get('list') || [];
  transactions.splice(index, 1);
  store.set('list', transactions);
});

ipcMain.on('overwrite-transactions', (event, newList) => {
  store.set('list', newList);
});

ipcMain.handle('export-data', async (event, format) => {
  const transactions = store.get('list') || [];

  const filters = format === 'csv'
    ? [{ name: 'CSV Files', extensions: ['csv'] }]
    : [{ name: 'JSON Files', extensions: ['json'] }];

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Transactions',
    defaultPath: `transactions.${format}`,
    filters
  });

  if (canceled || !filePath) return;

  let content = '';

  if (format === 'json') {
    content = JSON.stringify(transactions, null, 2);
  } else {
    const headers = ['description', 'amount', 'category', 'date', 'type', 'isFavorite'];
    const rows = transactions.map(tx =>
      headers.map(h => tx[h]).join(',')
    );
    content = `${headers.join(',')}\n${rows.join('\n')}`;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
});
