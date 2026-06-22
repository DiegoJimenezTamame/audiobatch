const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  listFiles: (folder, ext) => ipcRenderer.invoke('list-files', folder, ext),
  previewRenames: (data) => ipcRenderer.invoke('preview-renames', data),
  runRenames: (data) => ipcRenderer.invoke('run-renames', data),
  checkFfmpeg: () => ipcRenderer.invoke('check-ffmpeg'),
  convertFiles: (data) => ipcRenderer.invoke('convert-files', data),
  openFolder: (folder) => ipcRenderer.invoke('open-folder', folder),
  onConvertProgress: (cb) => ipcRenderer.on('convert-progress', (_, data) => cb(data)),
  removeConvertProgress: () => ipcRenderer.removeAllListeners('convert-progress')
})
