const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('budgetAPI', {
  addTransaction: (data) => ipcRenderer.send('add-transaction', data),
  getTransactions: () => ipcRenderer.invoke('get-transactions'),
  deleteTransaction: (index) => ipcRenderer.send('delete-transaction', index),
  exportData: (format) => ipcRenderer.invoke('export-data', format),
  overwriteTransactions: (newList) => ipcRenderer.send('overwrite-transactions', newList)
});
